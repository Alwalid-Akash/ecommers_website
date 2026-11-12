const jwt = require("jsonwebtoken");

// The payload is readable by anyone (base64), so only non-secret identity
// data goes in here. The signature is what stops it from being edited.
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

module.exports = generateToken;
