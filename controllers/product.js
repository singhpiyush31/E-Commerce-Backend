const Product = require("../models/product");
const Category = require("../models/category");

exports.createProduct = async (req, res) => {
    try {
        const { name, description, price, category, stock, image, brand } =
            req.body;
        if (!name || !price || !brand || !description || !category) {
            return res.status(400).json({
                message:
                    "Name, description, price, brand and category are required!",
            });
        }
        const categoryExist = await Category.findById(category);
        if (!categoryExist) {
            return res.status(404).json({ message: "Category not found!" });
        }
        const product = new Product({
            name,
            description,
            price,
            category,
            stock,
            image,
            brand,
            user: req.user._id,
        });
        await product.save();
        res.status(201).json({
            message: "Product created successfully!",
            product,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};
