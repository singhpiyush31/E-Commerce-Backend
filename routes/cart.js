const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const { createCart } = require("../controllers/cart");

const cartRouter = express.Router();

cartRouter.post("/", userAuth, createCart);

module.exports = cartRouter;
