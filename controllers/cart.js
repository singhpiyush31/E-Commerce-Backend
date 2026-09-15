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
                .status(400)
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

exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id }).populate(
            "items.product",
            "name stock price image isActive",
        );

        if (!cart) {
            return res.status(200).json({
                message: "Your Cart: ",
                items: [],
                totalQuantity: 0,
                totalAmount: 0,
            });
        }

        let totalQuantity = 0;
        let totalAmount = 0;
        for (let i = 0; i < cart.items.length; i++) {
            totalQuantity += cart.items[i].quantity;
            totalAmount += cart.items[i].product.price * cart.items[i].quantity;
        }

        res.status(200).json({
            message: "Your Cart: ",
            items: cart.items,
            totalQuantity,
            totalAmount,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const loggedInUser = req.user._id;
        const clearCart = await Cart.findOne({ user: loggedInUser });

        if (!clearCart) {
            return res.status(404).json({ message: "Cart not found!" });
        }

        clearCart.items = [];
        await clearCart.save();

        res.status(200).json({
            message: "Cart cleared successfully!",
            clearCart,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};

exports.removeProductFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const loggedInUser = req.user._id;

        if (!productId) {
            return res.status(400).json({ message: "ProductId is required!" });
        }

        const cart = await Cart.findOne({ user: loggedInUser });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found!" });
        }

        const item = cart.items.find((val) => {
            return val.product.toString() === productId;
        });

        if (!item) {
            return res.status(404).json({ message: "Product not in cart! " });
        }

        let newItem = [];
        // for (let i = 0; i < cart.items.length; i++) {
        //     if(cart.items[i].product.toString() !== productId) {
        //         newItem.push(cart.items[i]);
        //     }
        // }
        // cart.items = newItem;

        newItem = cart.items.filter((val) => {
            return val.product.toString() !== productId;
        });

        cart.items = newItem;

        await cart.save();

        res.status(200).json({
            message: "Product removed from the cart",
            cart,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};

exports.updateProductQuantity = async (req, res) => {
    try {
        const productId = req.params.productId.toString();
        const loggedInUser = req.user._id;
        const quantity = parseInt(req.body.quantity);

        if (quantity < 0 || isNaN(quantity)) {
            return res
                .status(400)
                .json({ message: "Quantity must be 0 or more" });
        }

        const cart = await Cart.findOne({ user: loggedInUser });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found!" });
        }

        const item = cart.items.find((val) => {
            return val.product.toString() === productId;
        });

        if (!item) {
            return res.status(404).json({ message: "Product not in cart!" });
        }

        if (quantity === 0) {
            cart.items = cart.items.filter(
                (val) => val.product.toString() !== productId,
            );
            await cart.save();
            return res
                .status(200)
                .json({ message: "Product removed from cart!" });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found!" });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: `Only ${product.stock} items available in stock`,
            });
        }

        item.quantity = quantity;
        await cart.save();

        res.status(200).json({ message: "Cart updated successfully!", cart });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};
