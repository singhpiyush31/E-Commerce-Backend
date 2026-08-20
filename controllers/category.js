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
        const category = await Category.find()
            .populate("user", "name email")
            .populate("updatedBy", "name email")
            .sort({ _id: -1 });
        let totalCategories = category.length;

        res.status(200).json({ message: "Categories: ", category, totalCategories });
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error!", error: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description } = req.body;
        const updateCategory = await Category.findByIdAndUpdate(
            categoryId,
            { name, description, user: req.user._id },
            { returnDocument: "after", runValidators: true },
        )
        if (!updateCategory) {
            return res.status(404).json({ message: "Category not found!" });
        }
        res.status(200).json({ message: "Updated Category: ", updateCategory });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};
