const express = require("express");
const router = express.Router();

// Controllers
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

// Middleware
const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Validators
const {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,  // For validating ID params
} = require("../validators/categoryValidator");

// ============================
// PUBLIC ROUTES (No auth required)
// ============================

// GET all categories
router.get("/", getCategories);

// GET category by ID
router.get("/:id", getCategoryById);

// ============================
// PROTECTED ROUTES (Admin only)
// ============================

// POST create category
router.post(
  "/",
  protect,                          // Must be logged in
  authorize("admin"),               // Must be admin
  validate(createCategorySchema),   // Validate body
  createCategory
);

// PUT update category
router.put(
  "/:id",
  protect,
  authorize("admin"),
  validate(updateCategorySchema),   // ← Added validation
  updateCategory
);

// DELETE category
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteCategory
);

module.exports = router;