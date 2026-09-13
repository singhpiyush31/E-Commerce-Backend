const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");
const { getPagination } = require("../utils/pagination");
const { searchRegex, dateRange } = require("../utils/filter");

exports.createOrder = async (req, res) => {
    try {
        const { paymentMethod, address } = req.body;
        const loggedInUser = req.user._id;
        if (!address) {
            return res.status(400).json({ message: "Address is required!" });
        }
        const cart = await Cart.findOne({ user: loggedInUser }).populate(
            "items.product",
        );

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }
        const orderItems = [];
        let totalAmount = 0;

        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = item.product;

            if (product === null || product.isActive === false) {
                return res.status(400).json({
                    message: "Some product in your cart is not available",
                });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Only ${product.stock} items left for ${product.name}`,
                });
            }
            orderItems.push({
                name: product.name,
                price: product.price,
                product: product._id,
                quantity: item.quantity,
            });
            totalAmount = totalAmount + item.quantity * product.price;
        }

        const order = new Order({
            items: orderItems,
            user: loggedInUser,
            totalAmount,
            paymentMethod,
            address,
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

exports.myOrder = async (req, res) => {
    try {
        const loggedInUser = req.user._id;

        const { page, limit, skip } = getPagination(req.query);

        const filter = { user: loggedInUser };

        if (req.query.search) {
            filter["items.name"] = searchRegex(req.query.search);
        }
        if (req.query.status) {
            filter.status = searchRegex(req.query.status);
        }
        if (req.query.paymentMethod) {
            filter.paymentMethod = searchRegex(req.query.paymentMethod);
        }
        if (req.query.from || req.query.to) {
            filter.createdAt = dateRange(req.query.from, req.query.to);
        }

        let sort = -1;
        if (req.query.sort == "oldest") {
            sort = 1;
        }
        const totalOrder = await Order.countDocuments(filter);
        const totalPage = Math.ceil(totalOrder / limit);

        const order = await Order.find(filter)
            .sort({ createdAt: sort })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            message: "My order: ",
            order,
            page,
            limit: limit,
            skip: skip,
            totalPage: totalPage,
            totalOrder: totalOrder,
        });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const loggedInUser = req.user._id.toString();

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found!" });
        }

        const orderUserId = order.user.toString();

        if (orderUserId !== loggedInUser) {
            if (req.user.role !== "Admin") {
                return res
                    .status(403)
                    .json({ message: "You can view only your order!" });
            }
        }

        res.status(200).json({ message: "Order: ", order });
    } catch (err) {
        res.status(500).json({
            message: "Internal Server Error!",
            error: err.message,
        });
    }
};
