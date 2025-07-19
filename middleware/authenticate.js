const { verifyToken } = require("../utils/jwt");
const User = require("../model/users.model");

/**
 * Authentication middleware to verify JWT token and set user data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        error: "You are not authorized!",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = verifyToken(token);
    const userId = decoded.user_id;

    // Find user in database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        status: "error",
        error: "User not found",
      });
    }

    // Check if user is deleted
    if (user.deleted) {
      return res.status(401).json({
        status: "error",
        error: "User account has been deactivated",
      });
    }

    // Set user data in request object
    req.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      error: error.message || "Invalid token",
    });
  }
};

module.exports = authenticate;
