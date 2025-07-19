const mongoose = require("mongoose");
const Transaction = require("../model/transaction.model");

// Get all transactions (excluding deleted) with cursor-based pagination
exports.getAllTransactions = async (req, res) => {
  try {
    let {
      tags,
      type,
      startDate,
      endDate,
      cursor,
      limit = 20,
      direction = "next",
      _ids,
    } = req.query;

    const filter = { deleted: false, user: req.user._id };
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100); // Max 100 items per page

    if (type) {
      filter.type = type;
    }

    if (_ids) {
      const idList = Array.isArray(_ids) ? _ids : _ids.split(",");
      filter._id = {
        $in: idList.map((id) =>
          mongoose.Types.ObjectId.createFromHexString(id)
        ),
      };
    }

    if (typeof tags === "string" && tags.toLowerCase() === "none") {
      tags = [];
    }

    if (tags) {
      if (Array.isArray(tags) && tags.length === 0) {
        filter["tags.0"] = { $exists: false };
      } else {
        // tags can be a comma-separated list
        const tagList = Array.isArray(tags) ? tags : tags.split(",");
        filter.tags = { $in: tagList };
      }
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Add cursor-based pagination
    if (cursor) {
      try {
        const cursorId = mongoose.Types.ObjectId.createFromHexString(cursor);
        if (direction === "prev") {
          filter._id = { $gt: cursorId };
        } else {
          filter._id = { $lt: cursorId };
        }
      } catch (err) {
        return res.status(400).json({ error: "Invalid cursor format" });
      }
    }

    // Always sort in descending order (newest first) for consistent behavior
    const sortOrder = { date: -1 };

    const transactions = await Transaction.find(filter)
      .populate("tags", "-user -createdAt -updatedAt -deleted")
      .select("-user -createdAt -updatedAt -deleted")
      .sort(sortOrder)
      .limit(limitNum + 1); // Fetch one extra to check if there are more

    // Check if there are more items
    const hasMore = transactions.length > limitNum;
    const items = hasMore ? transactions.slice(0, limitNum) : transactions;

    // Generate pagination info
    const pagination = {
      hasNext: direction === "next" ? hasMore : items.length > 0,
      hasPrev: direction === "prev" ? hasMore : cursor != null,
      nextCursor: null,
      prevCursor: null,
    };

    if (items.length > 0) {
      pagination.nextCursor = items[items.length - 1]._id.toString();
      pagination.prevCursor = items[0]._id.toString();
    }

    res.json({
      data: items,
      pagination,
      total: items.length,
    });
  } catch (err) {
    console.error(err);
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
      user: req.user._id,
    })
      .populate("tags", "-user -createdAt -updatedAt -deleted")
      .select("-user -createdAt -updatedAt -deleted");
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
      amount: Math.abs(amount),
      type,
      tags,
      date,
      user: req.user._id,
    });
    const savedTransaction = await newTransaction.save();
    const { user, createdAt, updatedAt, deleted, ...transactionResponse } =
      savedTransaction.toObject();
    res.status(201).json(transactionResponse);
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
        user: req.user._id,
      },
      update,
      { new: true }
    ).select("-user -createdAt -updatedAt -deleted");
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
      user: req.user._id,
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

// Search transactions by label, tags, and date range using MongoDB Atlas Search with page-based pagination
exports.searchTransactions = async (req, res) => {
  try {
    let {
      label,
      tags,
      type,
      startDate,
      endDate,
      select,
      page = 1,
      limit = 20,
    } = req.query;

    if (typeof tags === "string" && tags.toLocaleLowerCase() === "none") {
      tags = [];
    }

    const limitNum = Math.min(parseInt(limit, 10) || 20, 100); // Max 100 items per page
    const pageNum = Math.max(parseInt(page, 10) || 1, 1); // Minimum page 1
    const skip = (pageNum - 1) * limitNum;
    const must = [];

    // Always exclude deleted and filter by user
    must.push({
      equals: {
        path: "deleted",
        value: false,
      },
    });

    must.push({
      equals: {
        path: "user",
        value: req.user._id,
      },
    });

    if (label) {
      must.push({
        text: {
          query: label,
          path: "label",
        },
      });
    }

    if (type) {
      must.push({
        text: {
          path: "type",
          query: type,
        },
      });
    }

    if (tags) {
      // tags can be a comma-separated list or an array
      const tagList = Array.isArray(tags) ? tags : tags.split(",");
      if (Array.isArray(tags) && tags.length === 0) {
        // If tags is an empty array, find transactions with no tags attached
        must.push({
          equals: {
            path: "tags",
            value: [],
          },
        });
      } else {
        must.push({
          in: {
            path: "tags",
            value: tagList.map(
              (tag) => new mongoose.Types.ObjectId(tag.trim())
            ),
          },
        });
      }
    }

    if (startDate || endDate) {
      const range = { path: "date" };
      if (startDate) range.gte = new Date(startDate);
      if (endDate) range.lte = new Date(endDate);
      must.push({
        range,
      });
    }

    const pipeline = [
      {
        $search: {
          index: "transaction_search",
          compound: {
            must,
          },
        },
      },
      { $sort: { date: -1, _id: -1 } }, // Sort first for consistent ordering
      { $skip: skip }, // Skip documents for pagination
      { $limit: limitNum + 1 }, // Fetch one extra to check if there are more
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
    } else {
      // Default projection to exclude unwanted fields
      pipeline.push({
        $project: {
          user: 0,
          deleted: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
        },
      });
    }

    const results = await Transaction.aggregate(pipeline);

    // Check if there are more items
    const hasNext = results.length > limitNum;
    const items = hasNext ? results.slice(0, limitNum) : results;

    // Generate pagination info
    const pagination = {
      currentPage: pageNum,
      limit: limitNum,
      hasNext,
      totalItemsOnPage: items.length,
    };

    res.json({
      data: items,
      pagination,
      hasNext, // Include hasNext at top level as requested
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
