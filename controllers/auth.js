const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

exports.register = async (req, res) => {
    try {
        const { name, email, password, adminSecret } = req.body;

        if (!name || !email || !password) {
            return res
                .status(400)
                .json({ message: "All fields are required!" });
        }
        if (!emailRegex.test(email)) {
            return res
                .status(400)
                .json({ message: "Invalid format. Please check your email." });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be atleast 6 characters." });
        }

        const existEmail = await User.findOne({ email: email });
        if (existEmail) {
            return res.status(400).json({ message: "Email already exist!" });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        let role = "User";

        if (
            process.env.ADMIN_SECRET &&
            adminSecret === process.env.ADMIN_SECRET
        ) {
            role = "Admin";
        }

        const user = new User({
            name,
            email,
            password: passwordHash,
            role,
        });

        await user.save();
        res.status(201).json({
            message: "User registered successfully!",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "All fields are required!" });
        }

        if (!emailRegex.test(email)) {
            return res
                .status(400)
                .json({ message: "Invalid format. Please check your email." });
        }
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });
        res.cookie("token", token, { maxAge: 7 * 24 * 60 * 60 * 1000 })
            .status(200)
            .json({
                message: "LoggedIn Successfully!",
            });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.logout = async (req, res) => {
    try {
        res.cookie("token", "", { maxAge: 0 });
        res.status(200).json({ message: "Logout Successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};
