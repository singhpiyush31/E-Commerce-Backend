const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const { createOrder } = require("../controllers/order");

const orderRouter = express.Router();

orderRouter.post("/", userAuth, createOrder)

module.exports = orderRouter;
