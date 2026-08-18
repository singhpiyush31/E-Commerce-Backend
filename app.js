require("dotenv").config();

const express = require("express");
const cookieParser = require('cookie-parser');

const { connectDB } = require("./config/database");
const authRouter = require("./routes/auth");
const categoryRouter = require("./routes/category");

const app = express();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.use("/auth", authRouter);
app.use("/category", categoryRouter);

connectDB()
    .then(() => {
        console.log("Database connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server is listening on the ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("Database not connected!", err.message);
    });
