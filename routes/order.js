const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const { createOrder, myOrder, getOrderById } = require("../controllers/order");

const orderRouter = express.Router();

orderRouter.post("/", userAuth, createOrder);
orderRouter.get("/my", userAuth, myOrder);
orderRouter.get("/:id", userAuth, getOrderById);

module.exports = orderRouter;
