const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");

exports.createOrder = async (req, res) => {
    try {
        const { paymentMethod, address } = req.body;
        const loggedInUser = req.user._id;
        if (!address) {
            return res.status(400).json({ message: "Address is required!" });
        }
        const cart = await Cart.findOne({ user: loggedInUser }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        const orderItems = [];
        let totalAmount = 0;
        
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = item.product;

            if (product === null || product.isActive === false) {
                return res.status(400).json({ message: "Some product in your cart is not available" });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Only ${product.stock} items left for ${product.name}`});
            }
            orderItems.push({
                name: product.name,
                price: product.price,
                product: product._id,
                quantity: item.quantity
            });
            totalAmount = totalAmount + (item.quantity * product.price); 
        }

        const order = new Order ({
            items: orderItems,
            user: loggedInUser,
            totalAmount,
            paymentMethod,
            address
        });
        await order.save();
        cart.items = [];
        await cart.save();

        for (let i = 0; i < orderItems.length; i++) {
            const productId = orderItems[i].product;
            let product = await Product.findById(productId);
            product.stock = product.stock - orderItems[i].quantity;
            await product.save();
        }
        res.status(201).json({ message: "Order placed successfully", order });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};
