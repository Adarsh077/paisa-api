const jwt = require("jsonwebtoken");

/**
 * Generate JWT token with only user_id
 * @param {string} userId - The user ID to include in the token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  if (!userId) {
    throw new Error("User ID is required to generate token");
  }

  const payload = {
    user_id: userId,
  };

  return jwt.sign(payload, process.env.JWT_SECRET);
};

/**
 * Verify JWT token and extract user_id
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  if (!token) {
    throw new Error("Token is required");
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
