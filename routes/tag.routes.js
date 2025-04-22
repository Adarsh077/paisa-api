const express = require("express");
const router = express.Router();
const tagController = require("../controller/tag.controller");

// GET all tags
router.get("/", tagController.getAllTags);

// Create a new tag
router.post("/", tagController.createTag);

// Soft delete a tag by ID
router.delete("/:tagId", tagController.deleteTag);

// Update a tag label by ID
router.patch("/:tagId", tagController.updateTag);

module.exports = router;
