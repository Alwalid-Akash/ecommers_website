const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../controllers/cartController");
const validate = require("../middleware/validate");
const {
  addToCartSchema,
  updateCartSchema,
} = require("../validators/cartValidator");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Every cart route requires a logged-in user.
router.use(protect);

router.get("/", getCart);
router.post("/", validate(addToCartSchema), addToCart);
router.put("/:productId", validate(updateCartSchema), updateCartItem);
router.delete("/:productId", removeFromCart);
router.delete("/", clearCart);

module.exports = router;
