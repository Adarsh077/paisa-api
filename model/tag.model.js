const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("tags", tagSchema);
