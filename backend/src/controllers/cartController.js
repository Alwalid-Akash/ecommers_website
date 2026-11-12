const pool = require("../config/db");

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT
        ci.id,
        ci.product_id,
        p.name,
        p.price,
        p.image_url,
        p.stock,
        ci.quantity,
        (p.price * ci.quantity) AS subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
      `,
      [req.user.id]
    );

    const total = result.rows.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0
    );

    res.status(200).json({
      success: true,
      items: result.rows,
      total: Number(total.toFixed(2)),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart   body: { product_id, quantity }  (validated by addToCartSchema)
const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body; // numbers, thanks to the validator

    const productResult = await pool.query(
      "SELECT id, stock FROM products WHERE id = $1",
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { stock } = productResult.rows[0];

    const existingItem = await pool.query(
      "SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [req.user.id, product_id]
    );

    const currentQuantity = existingItem.rows[0]?.quantity ?? 0;
    const newQuantity = currentQuantity + quantity;

    if (newQuantity > stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    // Insert, or add to the existing line if the product is already in the cart.
    // Relies on UNIQUE(user_id, product_id) in cart_items.
    const result = await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = EXCLUDED.quantity,
                    updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [req.user.id, product_id, newQuantity]
    );

    const isNew = existingItem.rows.length === 0;

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? "Product added to cart" : "Cart updated",
      item: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/:productId   body: { quantity }  (validated by updateCartSchema)
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const productResult = await pool.query(
      "SELECT stock FROM products WHERE id = $1",
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (quantity > productResult.rows[0].stock) {
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });
    }

    const result = await pool.query(
      `
      UPDATE cart_items
      SET quantity = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND product_id = $3
      RETURNING *
      `,
      [quantity, req.user.id, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cart updated",
      item: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/:productId
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
      `,
      [req.user.id, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [
      req.user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
