const Category = require("../models/category");

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res
                .status(400)
                .json({ message: "Category name is required!" });
        }
        const isExist = await Category.findOne({ name: name });

        if (isExist) {
            return res
                .status(400)
                .json({ message: "Category already exists!" });
        }
        const category = new Category({
            name,
            description,
            user: req.user._id,
        });
        await category.save();
        res.status(201).json({
            message: "Category created successfully!",
            category,
        });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
};


exports.getCategory = async (req,res) => {
    try {
        const category = await Category.find().select("-user").sort({ _id: -1 });
        let totalCategories = category.length;

        res.status(200).json({ message: "Categories: ", category, totalCategories });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error!", error: err.message });
    }
};