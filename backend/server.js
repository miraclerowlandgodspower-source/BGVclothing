const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());

app.use(express.json());


// Connect to MongoDB
connectDB();


// Routes
app.use("/api/auth", authRoutes);

app.use("/api/payment", paymentRoutes);


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

if (require.main === module) {

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

}


module.exports = app;