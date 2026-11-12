const express = require("express");

const {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} = require("../controllers/adminOrderController");
const validate = require("../middleware/validate");
const { orderStatusSchema } = require("../validators/orderValidator");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getAllOrders);
router.get("/:id", getOrderByIdAdmin);
router.put("/:id/status", validate(orderStatusSchema), updateOrderStatus);

module.exports = router;
