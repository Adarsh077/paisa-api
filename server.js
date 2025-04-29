require("dotenv").config();

const mongoose = require("mongoose");

// Remove __v from all responses globally
mongoose.set("toJSON", {
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});
mongoose.set("toObject", {
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const app = require("./app");
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/paisa")
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
