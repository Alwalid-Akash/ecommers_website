const express = require("express");

const {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} = require("../controllers/adminOrderController");

const { protect, authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getAllOrders);
router.get("/:id", getOrderByIdAdmin);
router.put("/:id/status", updateOrderStatus);

module.exports = router;