const express = require("express");
const router = express.Router();
const userReportsController = require("../controller/user-reports.controller");

router.post("/", userReportsController.createUserReport);

module.exports = router;
