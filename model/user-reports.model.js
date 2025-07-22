const mongoose = require("mongoose");

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
    messages: {
      type: [Object],
      default: [],
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user-reports", userReportSchema);
