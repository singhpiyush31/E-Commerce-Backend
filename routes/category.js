const express = require('express');

const { createCategory } = require('../controllers/category');
const { userAuth, isAdmin } = require('../middlewares/authentication');

const categoryRouter = express.Router();

categoryRouter.post("/", userAuth, isAdmin, createCategory);

module.exports = categoryRouter;