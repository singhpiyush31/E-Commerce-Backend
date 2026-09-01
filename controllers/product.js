const Product = require("../models/product");
const Category = require("../models/category");
const { getPagination } = require("../utils/pagination");
const { searchRegex, numberRange } = require("../utils/filter");

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

exports.getProduct = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        let sortOptions = { createdAt: -1 };

        if (req.query.sort === "oldest") {
            sortOptions = { createdAt: 1 };
        } else if (req.query.sort === "price-high") {
            sortOptions = { price: -1 };
        } else if (req.query.sort === "price-low") {
            sortOptions = { price: 1 };
        }

        const filter = { isActive: true };

        if (req.query.search) {
            filter.name = searchRegex(req.query.search);
        }
        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = numberRange(req.query.minPrice, req.query.maxPrice);
        }

        if (req.query.brand) {
            filter.brand = searchRegex(req.query.brand);
        }
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.inStock === "true") {
            filter.stock = { $gte: 1 };
        }

        const product = await Product.find(filter)
            .populate("category", "name")
            .select("-user")
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(filter);
        const totalPage = Math.ceil(totalProducts / limit);

        res.status(200).json({
            message: "Products",
            product,
            page: page,
            limit: limit,
            totalProducts,
            totalPage: totalPage,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findOne({
            _id: productId,
            isActive: true,
        })
            .populate("category", "name")
            .select("-user");

        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.status(200).json({ message: "Product", product });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.deleteProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        const deleteProduct = await Product.findByIdAndDelete(productId);

        if (!deleteProduct) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.status(200).json({ message: "Product deleted successfully!" });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};

exports.updateProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const {
            name,
            description,
            price,
            category,
            stock,
            image,
            brand,
            isActive,
        } = req.body;

        if (category) {
            const isExist = await Category.findById(category);
            if (!isExist) {
                return res.status(404).json({ message: "Category not found!" });
            }
        }
        const product = await Product.findByIdAndUpdate(
            productId,
            {
                name,
                description,
                price,
                category,
                stock,
                image,
                brand,
                isActive,
            },
            { returnDocument: "after", runValidators: true },
        );
        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.status(200).json({
            message: "Product updated successfully!",
            product,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};
