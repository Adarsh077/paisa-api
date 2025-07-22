const UserReport = require("../model/user-reports.model");

exports.createUserReport = async (req, res) => {
  try {
    const { type, description, messages } = req.body;

    const userId = req.user._id;

    const newUserReport = new UserReport({
      type,
      user: userId,
      description,
      messages,
    });

    const savedReport = await newUserReport.save();

    return res.status(201).json({
      success: true,
      data: savedReport,
    });
  } catch (error) {
    console.error("Error creating user report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user report",
      error: error.message,
    });
  }
};
