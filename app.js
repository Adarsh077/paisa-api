const express = require("express");
const authenticate = require("./middleware/authenticate");

const app = express();
app.use(express.json());

app.use("/auth", require("./routes/auth.routes"));

app.use(authenticate);

app.use("/tags", require("./routes/tag.routes"));
app.use("/transactions", require("./routes/transaction.routes"));

module.exports = app;
