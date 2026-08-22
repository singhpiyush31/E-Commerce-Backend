const express = require("express");
const { createProduct } = require("../controllers/product");
const { userAuth, isAdmin } = require("../middlewares/authentication");

const productRouter = express.Router();

productRouter.post("/", userAuth, isAdmin, createProduct);

module.exports = productRouter;
