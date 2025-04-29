const express = require("express");
const tagRoutes = require("./routes/tag.routes");
const transactionRoutes = require("./routes/transaction.routes");

const app = express();

app.use(express.json());

app.use("/tags", tagRoutes);
app.use("/transactions", transactionRoutes);

module.exports = app;
