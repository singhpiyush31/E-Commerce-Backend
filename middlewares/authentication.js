const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.userAuth = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(404).json({ message: "Please login again!" });
        }

        const obj = jwt.verify(token, process.env.JWT_SECRET);

        const { id } = obj;

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "Please login again!" });
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "Admin") {
        return res.status(404).json({ message: "Only admins are allowed!" });
    }
    next();
};
