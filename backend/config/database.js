const mongoose = require("mongoose");

let connectionPromise;

async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    // Concurrent requests share one connection attempt in each function.
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        }).finally(() => {
            // Allow a later request to reconnect after a failure/disconnect.
            connectionPromise = undefined;
        });
    }

    return connectionPromise;
}

module.exports = connectDB;
