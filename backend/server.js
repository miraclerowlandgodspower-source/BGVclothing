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


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});