const express = require('express');
const { register, login, logout, me } = require('../controllers/auth');
const { userAuth } = require('../middlewares/authentication');

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", userAuth, me);

module.exports = authRouter;