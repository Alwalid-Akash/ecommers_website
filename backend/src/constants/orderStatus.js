// Single source of truth for order statuses.
// Must match the CHECK constraint on orders.status in config/schema.sql.
const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

module.exports = { ORDER_STATUSES };
