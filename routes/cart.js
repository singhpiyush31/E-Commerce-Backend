const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const { createCart, getCart } = require("../controllers/cart");

const cartRouter = express.Router();

cartRouter.post("/", userAuth, createCart);
cartRouter.get("/", userAuth, getCart);

module.exports = cartRouter;
