const express = require('express');

const { createCategory, getCategory, updateCategory, deleteCategory } = require('../controllers/category');
const { userAuth, isAdmin } = require('../middlewares/authentication');

const categoryRouter = express.Router();

categoryRouter.post("/", userAuth, isAdmin, createCategory);
categoryRouter.get("/", getCategory);
categoryRouter.patch("/:id", userAuth, isAdmin, updateCategory);
categoryRouter.delete("/:id", userAuth, isAdmin, deleteCategory);

module.exports = categoryRouter;