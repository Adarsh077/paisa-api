const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "tags" }],
    date: { type: Date, required: true, default: Date.now },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("transactions", transactionSchema);
