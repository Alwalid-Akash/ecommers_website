const express = require("express");

const {
  getDashboardStats,
} = require("../controllers/adminDashboardController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard/stats", protect, adminOnly, getDashboardStats);

module.exports = router;
