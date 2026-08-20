const express = require('express');

const { createCategory, getCategory, updateCategory } = require('../controllers/category');
const { userAuth, isAdmin } = require('../middlewares/authentication');

const categoryRouter = express.Router();

categoryRouter.post("/", userAuth, isAdmin, createCategory);
categoryRouter.get("/", getCategory);
categoryRouter.patch("/:id", userAuth, isAdmin, updateCategory);

module.exports = categoryRouter;