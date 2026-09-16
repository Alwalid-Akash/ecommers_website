const express = require("express");

const {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} = require("../controllers/adminOrderController");

// authMiddleware.js exports { protect } → needs { }
const { protect } = require("../middleware/authMiddleware");

// roleMiddleware.js exports the function directly → NO { }
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getAllOrders);
router.get("/:id", getOrderByIdAdmin);
router.put("/:id/status", updateOrderStatus);

module.exports = router;