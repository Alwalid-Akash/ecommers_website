const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", createOrder);

router.get("/", getOrders);

router.get("/:id", getOrderById);

module.exports = router;