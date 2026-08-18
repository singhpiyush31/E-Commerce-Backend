const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: 2,
        maxLength: 100,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minLength: 20,
        maxLength: 500,
    },
    price: {
        type: Number,
        required: true,
        min: 10,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cateogry",
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    image: {
        type: String,
        trim: true,
    },
    brand: {
        type: String,
        required: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

}, {timestamps: true });

module.exports = mongoose.model("Products", productsSchema);