const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                    min: 1,
                },
                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["COD", "UPI", "CARD", "Other"],
            default: "COD",
        },
        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
            default: "Pending",
        },
        address: {
            type: String,
            required: true,
            trim: true,
            minLength: 10,
            maxLength: 500,
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
