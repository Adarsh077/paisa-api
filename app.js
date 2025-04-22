const express = require("express");
const mongoose = require("mongoose");
const tagRoutes = require("./routes/tag.routes");

const app = express();

app.use(express.json());

// Tag routes
app.use("/tag", tagRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/paisa")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

module.exports = app;
