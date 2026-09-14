const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test, before, after } = require("node:test");

const root = path.resolve(__dirname, "../..");
const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));

function loadDatabase(mongoose, env = { MONGODB_URI: "mongodb://test.invalid/test" }) {
    const context = {
        require(name) {
            assert.equal(name, "mongoose");
            return mongoose;
        },
        module: { exports: {} },
        process: { env }
    };
    vm.runInNewContext(
        fs.readFileSync(path.join(root, "backend/config/database.js"), "utf8"),
        context
    );
    return context.module.exports;
}

test("database rejects missing configuration without opening a connection", async () => {
    const connectDB = loadDatabase({
        connection: { readyState: 0 },
        connect() { throw new Error("Must not connect"); }
    }, {});
    await assert.rejects(connectDB(), /MONGODB_URI is not configured/);
});

test("database reuses an established connection", async () => {
    const mongoose = {
        connection: { readyState: 1 },
        connect() { throw new Error("Must not reconnect"); }
    };
    assert.equal(await loadDatabase(mongoose)(), mongoose);
});

test("concurrent database requests share one bounded connection attempt", async () => {
    let calls = 0;
    let finish;
    const mongoose = {
        connection: { readyState: 0 },
        connect(uri, options) {
            calls++;
            assert.equal(uri, "mongodb://test.invalid/test");
            assert.equal(options.serverSelectionTimeoutMS, 5000);
            return new Promise(resolve => { finish = resolve; });
        }
    };
    const connectDB = loadDatabase(mongoose);
    const first = connectDB();
    const second = connectDB();
    assert.equal(calls, 1);
    finish(mongoose);
    await Promise.all([first, second]);
});

test("a failed database connection can be retried", async () => {
    let calls = 0;
    const mongoose = {
        connection: { readyState: 0 },
        connect() {
            return ++calls === 1
                ? Promise.reject(new Error("Temporary failure"))
                : Promise.resolve(mongoose);
        }
    };
    const connectDB = loadDatabase(mongoose);
    await assert.rejects(connectDB(), /Temporary failure/);
    assert.equal(await connectDB(), mongoose);
    assert.equal(calls, 2);
});

test("a disconnected instance starts a new database connection", async () => {
    let calls = 0;
    const mongoose = {
        connection: { readyState: 0 },
        connect() {
            calls++;
            return Promise.resolve(mongoose);
        }
    };
    const connectDB = loadDatabase(mongoose);
    await connectDB();
    await connectDB();
    assert.equal(calls, 2);
});

for (const [origin, expected] of [
    ["https://bg-vclothing.vercel.app", "https://bg-vclothing.vercel.app"],
    ["https://example-preview.vercel.app", "https://example-preview.vercel.app"],
    ["http://localhost:5500", "http://localhost:3000"],
    ["http://127.0.0.1:5500", "http://127.0.0.1:3000"],
    ["http://[::1]:5500", "http://[::1]:3000"]
]) {
    test(`frontend API base for ${origin}`, () => {
        const actual = vm.runInNewContext(
            fs.readFileSync(path.join(root, "config.js"), "utf8") + "\nAPI_BASE;",
            { window: { location: new URL(origin) } }
        );
        assert.equal(actual, expected);
    });
}

test("Vercel routes every API path to the Node function before static files", () => {
    const api = config.routes[0];
    for (const route of ["/api", "/api/health", "/api/auth/login", "/api/auth/register", "/api/payment/initialize", "/api/payment/verify/example"]) {
        assert.match(route, new RegExp(`^${api.src}$`));
    }
    assert.equal(api.dest, "/backend/server.js");
    assert.ok(fs.existsSync(path.join(root, api.dest.slice(1))));
    assert.doesNotMatch("/login.html", new RegExp(`^${api.src}$`));
    assert.equal(config.routes.find(route => route.src === "/").dest, "/index.html");
});

test("Vercel only publishes explicit storefront assets, not backend or secret files", () => {
    const patterns = config.builds.filter(build => build.use === "@vercel/static").map(build => build.src);
    assert.deepEqual(patterns, ["*.html", "*.css", "config.js", "script.js", "images/**"]);
    const backendRule = config.routes.find(route => route.src?.startsWith("/backend"));
    assert.equal(backendRule.status, 404);
    assert.match("/backend/.env", new RegExp(`^${backendRule.src}$`));
    assert.match("/backend/server.js", new RegExp(`^${backendRule.src}$`));
    const backendBuild = config.builds.find(build => build.use === "@vercel/node");
    assert.equal(backendBuild.config.excludeFiles, "**/.env*");
    for (const file of ["backend/vercel.json", "backend/package.json", "backend/package-lock.json"]) {
        JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
    }
});

// Never load the real .env or use any real database/payment credentials.
process.env.VERCEL = "1";
delete process.env.MONGODB_URI;
delete process.env.PAYSTACK_SECRET_KEY;
const mongoose = require("mongoose");
let connectCalls = 0;
mongoose.connect = async () => {
    connectCalls++;
    return mongoose;
};
const app = require("../server");
let server;
let baseURL;

before(async () => {
    server = await new Promise(resolve => {
        const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
    });
    baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test("liveness works without secrets and does not call the database", async () => {
    const response = await fetch(`${baseURL}/api/health`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { status: "ok", service: "baggy-clothing-api" });
    assert.equal(connectCalls, 0);
});

test("missing database settings return JSON 503 instead of crashing the function", async () => {
    for (const [route, options] of [
        ["/api/health/ready", {}],
        ["/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }],
        ["/api/payment/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }]
    ]) {
        const response = await fetch(baseURL + route, options);
        assert.equal(response.status, 503);
        assert.equal((await response.json()).message, "Database unavailable. Please try again shortly.");
    }
    assert.equal(connectCalls, 0);
});

test("readiness succeeds after a mocked database connection", async () => {
    process.env.MONGODB_URI = "mongodb://test.invalid/test";
    try {
        const response = await fetch(`${baseURL}/api/health/ready`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { status: "ready" });
        assert.ok(connectCalls > 0);
    } finally {
        delete process.env.MONGODB_URI;
    }
});

test("auth and payment routes remain mounted and validate empty input", async () => {
    process.env.MONGODB_URI = "mongodb://test.invalid/test";
    try {
        for (const route of ["/api/auth/login", "/api/auth/register", "/api/payment/initialize"]) {
            const response = await fetch(baseURL + route, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
            });
            assert.equal(response.status, 400);
            assert.equal(typeof (await response.json()).message, "string");
        }
    } finally {
        delete process.env.MONGODB_URI;
    }
});

test("unknown API paths return JSON 404 without touching the database", async () => {
    const beforeCalls = connectCalls;
    const response = await fetch(`${baseURL}/api/does-not-exist`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: "API route not found" });
    assert.equal(connectCalls, beforeCalls);
});
