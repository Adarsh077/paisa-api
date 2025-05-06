const mongoose = require("mongoose");
const Transaction = require("../model/transaction.model");

// Get all transactions (excluding deleted)
exports.getAllTransactions = async (req, res) => {
  try {
    const { tags, type, startDate, endDate } = req.query;
    const filter = { deleted: false };

    if (type) {
      filter.type = type;
    }

    if (tags) {
      // tags can be a comma-separated list
      const tagList = Array.isArray(tags) ? tags : tags.split(",");
      filter.tags = { $in: tagList };
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate("tags")
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({
      _id: mongoose.Types.ObjectId.createFromHexString(transactionId),
      deleted: false,
    }).populate("tags");
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
  try {
    let { label, amount, type, tags, date } = req.body;
    if (!label || !amount || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!date) {
      date = Date.now();
    }

    const newTransaction = new Transaction({
      label,
      amount,
      type,
      tags,
      date,
    });
    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a transaction by ID
exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { label, tags, date, amount } = req.body;
    const update = {};
    if (label) update.label = label;
    if (tags) update.tags = tags;
    if (date) update.date = date;
    if (amount) update.amount = amount;
    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: mongoose.Types.ObjectId.createFromHexString(transactionId),
        deleted: false,
      },
      update,
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(transaction);
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "Server error" });
  }
};

// Soft delete a transaction by ID
exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findOne({
      _id: mongoose.Types.ObjectId.createFromHexString(transactionId),
      deleted: false,
    });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    transaction.deleted = true;
    await transaction.save();
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "Server error" });
  }
};

// Search transactions by label, tags, and date range using MongoDB Atlas Search
exports.searchTransactions = async (req, res) => {
  try {
    const { label, tags, startDate, endDate, select } = req.query;
    const must = [];

    if (label) {
      must.push({
        text: {
          query: label,
          path: "label",
        },
      });
    }

    if (tags) {
      // tags can be a comma-separated list
      const tagList = Array.isArray(tags) ? tags : tags.split(",");
      must.push({
        terms: {
          query: tagList,
          path: "tags",
        },
      });
    }

    if (startDate || endDate) {
      const range = { path: "date" };
      if (startDate) range.gte = new Date(startDate);
      if (endDate) range.lte = new Date(endDate);
      must.push({
        range,
      });
    }

    // Always exclude deleted
    must.push({
      equals: {
        path: "deleted",
        value: false,
      },
    });
    console.log(must);

    const pipeline = [
      {
        $search: {
          index: "transaction_search",
          compound: {
            must,
          },
        },
      },
      { $sort: { date: -1 } },
    ];

    // Add projection if select is provided
    if (select) {
      const fields = select
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      if (fields.length > 0) {
        const project = {};
        fields.forEach((field) => {
          project[field] = 1;
        });
        // Always include _id unless explicitly excluded
        if (!project.hasOwnProperty("_id")) project["_id"] = 1;
        pipeline.push({ $project: project });
      }
    }

    const results = await Transaction.aggregate(pipeline);
    res.json(results);
  } catch (err) {
    console.log(err);

    res.status(500).json({ error: "Server error" });
  }
};
