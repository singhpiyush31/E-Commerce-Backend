const express = require("express");
const {
    createProduct,
    getProduct,
    getProductById,
    deleteProductById,
    updateProductById,
} = require("../controllers/product");
const { userAuth, isAdmin } = require("../middlewares/authentication");

const productRouter = express.Router();

productRouter.post("/", userAuth, isAdmin, createProduct);
productRouter.get("/", getProduct);
productRouter.get("/:id", getProductById);
productRouter.patch("/:id", userAuth, isAdmin, updateProductById);
productRouter.delete("/:id", userAuth, isAdmin, deleteProductById);

module.exports = productRouter;