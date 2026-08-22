const express = require("express");
const { createProduct, getProduct } = require("../controllers/product");
const { userAuth, isAdmin } = require("../middlewares/authentication");

const productRouter = express.Router();

productRouter.post("/", userAuth, isAdmin, createProduct);
productRouter.get("/", getProduct);

module.exports = productRouter;
