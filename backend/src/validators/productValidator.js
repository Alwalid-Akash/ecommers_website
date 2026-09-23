const { z } = require("zod");

const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(255, "Product name must not exceed 255 characters"),

  description: z
    .string()
    .optional()
    .nullable(),

  price: z.coerce
    .number()
    .nonnegative("Price cannot be negative"),

  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),

  category_id: z.coerce
    .number()
    .int("Category ID must be an integer")
    .positive("Category ID must be positive")
    .optional()
    .nullable(),

  image_url: z
    .string()
    .url("Image URL must be a valid URL")
    .optional()
    .nullable(),
});

module.exports = {
  createProductSchema,
};