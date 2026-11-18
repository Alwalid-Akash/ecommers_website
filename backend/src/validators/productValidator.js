const { z } = require("zod");

// Used for both create (POST) and full update (PUT).
const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name must be at least 2 characters")
    .max(255, "Product name must not exceed 255 characters"),

  description: z.string().trim().max(5000).optional().nullable(),

  price: z.coerce.number().nonnegative("Price cannot be negative"),

  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .nonnegative("Stock cannot be negative")
    .default(0),

  category_id: z.coerce
    .number()
    .int("Category ID must be an integer")
    .positive("Category ID must be positive")
    .optional()
    .nullable(),

  // Either a full web address (https://…) or an image inside the frontend's
  // public folder, e.g. "/images/products/t-shirt.jpg".
  image_url: z
    .string()
    .trim()
    .refine(
      (value) => /^https?:\/\/\S+$/i.test(value) || /^\/[\w./-]+$/.test(value),
      "Image must be a web address (https://…) or a path like /images/products/photo.jpg"
    )
    .optional()
    .nullable(),
});

module.exports = {
  productSchema,
  // Kept so older imports keep working.
  createProductSchema: productSchema,
};
