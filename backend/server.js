const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("node:path");

// Vercel supplies secrets through project settings, never a bundled .env.
if (!process.env.VERCEL) {
    dotenv.config({ path: path.join(__dirname, ".env") });
}

const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());

app.use(express.json());


// Liveness is independent of database configuration and does not create data.
app.get("/api/health", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ status: "ok", service: "baggy-clothing-api" });
});

async function requireDatabase(req, res, next) {
    try {
        await connectDB();
        next();
    } catch (error) {
        // Do not log the connection URI or return credentials to the browser.
        console.error("Database connection unavailable:", error.name);
        res.status(503).json({
            message: "Database unavailable. Please try again shortly."
        });
    }
}

app.get("/api/health/ready", requireDatabase, (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({ status: "ready" });
});


// Routes
app.use("/api/auth", requireDatabase, authRoutes);

app.use("/api/payment", requireDatabase, paymentRoutes);

app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found" });
});


// Test route
app.get("/", (req, res) => {
    res.send("Baggy Clothing Backend is running!");
});


// ==========================================
// LOCAL DEV vs VERCEL
// ==========================================
// When you run this file directly (npm start / node server.js
// on your own machine), start a normal always-on server.
// On Vercel, this file is imported instead of run directly —
// Vercel wraps the exported `app` as a serverless function and
// handles starting/stopping it, so app.listen() must NOT run
// there (it would try to bind a port that doesn't exist).

if (require.main === module && !process.env.VERCEL) {

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

}


module.exports = app;
