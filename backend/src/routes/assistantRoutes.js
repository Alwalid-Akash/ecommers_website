const express = require("express");

const { askAssistant } = require("../controllers/assistantController");
const validate = require("../middleware/validate");
const rateLimit = require("../middleware/rateLimit");
const { assistantSchema } = require("../validators/assistantValidator");

const router = express.Router();

// Protects the free Gemini quota: N messages per IP per minute.
const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.ASSISTANT_RATE_LIMIT_MAX) || 10,
  message: "Too many messages, please wait a minute",
});

// Public: guests can ask too. Add `protect` before askAssistant to
// restrict it to logged-in users.
router.post("/", assistantLimiter, validate(assistantSchema), askAssistant);

module.exports = router;
