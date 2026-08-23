const { z } = require("zod");

const createProductSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(255),

  description: z
    .string()
    .optional(),

  price: z
    .number()
    .nonnegative("Price cannot be negative"),

  stock: z
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative"),

  category_id: z
    .number()
    .int()
    .positive()
    .optional(),

  image_url: z
    .string()
    .url()
    .optional(),
});

module.exports = {
  createProductSchema,
};