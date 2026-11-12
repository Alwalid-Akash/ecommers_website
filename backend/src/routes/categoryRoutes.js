const express = require("express");

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const { categorySchema } = require("../validators/categoryValidator");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Admin
router.post("/", protect, adminOnly, validate(categorySchema), createCategory);
router.put("/:id", protect, adminOnly, validate(categorySchema), updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
