const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { protect, authorize } = require("../middleware/roleMiddleware");

router.get(
  "/dashboard/stats",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      // Helper: safely run a query, return fallback on error
      const safeQuery = async (sql, fallback = null) => {
        try {
          const r = await pool.query(sql);
          return r.rows;
        } catch (e) {
          console.warn(`Query failed [${sql}]:`, e.message);
          return fallback;
        }
      };

      // Counts — try common table names
      const usersList =
        (await safeQuery("SELECT COUNT(*) FROM users")) ||
        (await safeQuery("SELECT COUNT(*) FROM customers")) ||
        [{ count: 0 }];

      const productsList =
        (await safeQuery("SELECT COUNT(*) FROM products")) ||
        [{ count: 0 }];

      const ordersList =
        (await safeQuery("SELECT COUNT(*) FROM orders")) ||
        [{ count: 0 }];

      // Revenue — try common column names
      const revenueList =
        (await safeQuery(
          "SELECT COALESCE(SUM(total), 0) AS total FROM orders"
        )) ||
        (await safeQuery(
          "SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders"
        )) ||
        (await safeQuery(
          "SELECT COALESCE(SUM(total_price), 0) AS total FROM orders"
        )) ||
        [{ total: 0 }];

      // Statuses
      const statusesList =
        (await safeQuery(
          "SELECT status, COUNT(*) FROM orders GROUP BY status"
        )) || [];

      const statusMap = statusesList.reduce((acc, r) => {
        const key = String(r.status).toLowerCase();
        acc[key] = Number(r.count);
        return acc;
      }, {});

      res.json({
        stats: {
          total_users: Number(usersList[0]?.count || 0),
          total_products: Number(productsList[0]?.count || 0),
          total_orders: Number(ordersList[0]?.count || 0),
          total_revenue: Number(revenueList[0]?.total || 0),
          pending_orders: statusMap.pending || 0,
          processing_orders: statusMap.processing || 0,
          shipped_orders: statusMap.shipped || 0,
          delivered_orders: statusMap.delivered || 0,
        },
      });
    } catch (err) {
      console.error("Dashboard stats error:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);

module.exports = router;