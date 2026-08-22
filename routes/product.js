const express = require("express");
const { createProduct, getProduct, getProductById } = require("../controllers/product");
const { userAuth, isAdmin } = require("../middlewares/authentication");

const productRouter = express.Router();

productRouter.post("/", userAuth, isAdmin, createProduct);
productRouter.get("/", getProduct);
productRouter.get("/:id", getProductById);

module.exports = productRouter;
