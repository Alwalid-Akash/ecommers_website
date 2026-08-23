const express = require("express");

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const validate = require("../middleware/validate");

const {
  createProductSchema,
} = require("../validators/productValidator");

const { protect } = require("../middleware/authMiddleware");

const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post(
  "/",
  protect,
  authorize("admin"),
  validate(createProductSchema),
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteProduct
);

module.exports = router;