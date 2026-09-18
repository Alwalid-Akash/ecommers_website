const pool = require("../config/db");

const getDashboardStats = async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (
          SELECT COALESCE(SUM(total_amount), 0)
          FROM orders
          WHERE status != 'cancelled'
        ) AS total_revenue,
        (
          SELECT COUNT(*)
          FROM orders
          WHERE status = 'pending'
        ) AS pending_orders,
        (
          SELECT COUNT(*)
          FROM orders
          WHERE status = 'processing'
        ) AS processing_orders,
        (
          SELECT COUNT(*)
          FROM orders
          WHERE status = 'shipped'
        ) AS shipped_orders,
        (
          SELECT COUNT(*)
          FROM orders
          WHERE status = 'delivered'
        ) AS delivered_orders
    `;

    const recentOrdersQuery = `
      SELECT
        o.id,
        o.user_id,
        u.name AS customer_name,
        u.email AS customer_email,
        o.total_amount,
        o.status,
        o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `;

    const [statsResult, recentOrdersResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(recentOrdersQuery),
    ]);

    const stats = statsResult.rows[0];

    res.status(200).json({
      success: true,
      stats: {
        total_users: Number(stats.total_users),
        total_products: Number(stats.total_products),
        total_orders: Number(stats.total_orders),
        total_revenue: Number(stats.total_revenue),
        pending_orders: Number(stats.pending_orders),
        processing_orders: Number(stats.processing_orders),
        shipped_orders: Number(stats.shipped_orders),
        delivered_orders: Number(stats.delivered_orders),
      },
      recent_orders: recentOrdersResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};