require("dotenv").config();

const express = require("express");

const { connectDB } = require("./config/database");
const authRouter = require("./routes/auth");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use("/auth", authRouter);

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
