const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, required: true },
    content: { type: String, required: true },
  },
  { _id: false }
);

const userReportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "offensive",
        "not correct",
        "spam",
        "inappropriate",
        "harassment",
        "other",
      ],
      default: "other",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    description: { type: String },
    messages: [messageSchema],
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user-reports", userReportSchema);
