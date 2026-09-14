const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

router.post("/register", async (req, res) => {
    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill in all fields"
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


// ==========================================
// LOGIN
// ==========================================

router.post("/login", async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter your email and password"
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: cleanEmail
        });

        if (!user) {
            return res.status(404).json({
                message: "Account not found. Please register first."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            message: "Welcome back!",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
});


module.exports = router;