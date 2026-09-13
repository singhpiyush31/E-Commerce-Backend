const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const { createOrder, myOrder } = require("../controllers/order");

const orderRouter = express.Router();

orderRouter.post("/", userAuth, createOrder);
orderRouter.get("/my", userAuth, myOrder);

module.exports = orderRouter;
