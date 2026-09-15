const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const { createCart, getCart, clearCart, removeProductFromCart, updateProductQuantity } = require("../controllers/cart");

const cartRouter = express.Router();

cartRouter.post("/", userAuth, createCart);
cartRouter.get("/", userAuth, getCart);
cartRouter.delete("/", userAuth, clearCart);
cartRouter.delete("/:productId", userAuth, removeProductFromCart);
cartRouter.patch("/:productId", userAuth, updateProductQuantity);

module.exports = cartRouter;
