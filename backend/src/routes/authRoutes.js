const express = require("express");

const { register, login, getMe } = require("../controllers/authController");
const validate = require("../middleware/validate");
const rateLimit = require("../middleware/rateLimit");
const { registerSchema, loginSchema } = require("../validators/authValidator");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Slows down password guessing: max N attempts per IP per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  message: "Too many login attempts, please try again in 15 minutes",
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/me", protect, getMe);

module.exports = router;
