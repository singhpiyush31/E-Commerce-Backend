const express = require("express");

const { userAuth } = require("../middlewares/authentication");
const {
    createOrder,
    myOrder,
    getOrderById,
    updateOrderStatusById,
} = require("../controllers/order");

const orderRouter = express.Router();

orderRouter.post("/", userAuth, createOrder);
orderRouter.get("/my", userAuth, myOrder);
orderRouter.get("/:id", userAuth, getOrderById);
orderRouter.patch("/:id/status", userAuth, updateOrderStatusById);

module.exports = orderRouter;
