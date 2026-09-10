const Cart = require("../models/cart");
const Product = require("../models/product");

exports.createCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const loggedInUser = req.user._id;

        if (!productId) {
            return res.status(400).json({ message: "Product-Id is required!" });
        }
        const qty = Number(quantity) || 1;
        if (qty <= 0) {
            return res
                .status(400)
                .json({ message: "Quantity must be atleast 1! " });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true,
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }
        if (product.stock === 0) {
            return res
                .status(404)
                .json({ message: "Product is out of stock!" });
        }

        let cart = await Cart.findOne({ user: loggedInUser });

        if (!cart) {
            cart = new Cart({
                user: loggedInUser,
                items: [],
            });
        }

        let item = cart.items.find(
            (val) => val.product.toString() === productId,
        );

        let alreadyInCart = 0;

        if (item) {
            alreadyInCart = item.quantity;
        }
        if (alreadyInCart + qty > product.stock) {
            return res.status(400).json({
                message: `Only ${product.stock} items is available in stock!`,
            });
        }
        if (item) {
            item.quantity = alreadyInCart + qty;
        } else {
            cart.items.push({ product: productId, quantity: qty });
        }
        await cart.save();
        res.status(200).json({ message: "Product added to cart", cart });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};
