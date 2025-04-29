const express = require("express");
const router = express.Router();
const tagController = require("../controller/tag.controller");

router.route("/").get(tagController.getAllTags).post(tagController.createTag);

router
  .route("/:tagId")
  .delete(tagController.deleteTag)
  .patch(tagController.updateTag);

module.exports = router;
