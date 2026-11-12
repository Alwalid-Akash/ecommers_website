const { z } = require("zod");

// z.coerce turns "2" into 2, so `existing + quantity` is real addition
// instead of string concatenation ("1" + "2" = "12").
const quantity = z.coerce
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(99, "Quantity cannot exceed 99");

const addToCartSchema = z.object({
  product_id: z.coerce
    .number()
    .int("Product ID must be an integer")
    .positive("Product ID must be positive"),
  quantity: quantity.default(1),
});

const updateCartSchema = z.object({
  quantity,
});

module.exports = { addToCartSchema, updateCartSchema };
