const pool = require("../config/db");

const getAllOrders = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      orders: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `
      SELECT
        o.id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
      `,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        oi.id,
        oi.product_id,
        p.name AS product_name,
        oi.quantity,
        oi.price,
        oi.quantity * oi.price AS subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      order: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const result = await pool.query(
      `
      UPDATE orders
      SET status = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
};