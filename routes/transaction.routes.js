const express = require("express");
const router = express.Router();
const transactionController = require("../controller/transaction.controller");

// List all transactions, create a transaction
router
  .route("/")
  .get(transactionController.getAllTransactions)
  .post(transactionController.createTransaction);

// Search transactions
router.get("/search", transactionController.searchTransactions);

// Get, update, delete a transaction by ID
router
  .route("/:transactionId")
  .get(transactionController.getTransactionById)
  .patch(transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

module.exports = router;
