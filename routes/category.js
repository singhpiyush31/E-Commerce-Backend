const express = require('express');

const { createCategory, getCategory } = require('../controllers/category');
const { userAuth, isAdmin } = require('../middlewares/authentication');

const categoryRouter = express.Router();

categoryRouter.post("/", userAuth, isAdmin, createCategory);
categoryRouter.get("/", getCategory);

module.exports = categoryRouter;