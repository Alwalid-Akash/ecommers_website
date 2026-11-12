const { z } = require("zod");
const { ORDER_STATUSES } = require("../constants/orderStatus");

const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    message: `Status must be one of: ${ORDER_STATUSES.join(", ")}`,
  }),
});

module.exports = { orderStatusSchema };
