const pool = require("../config/db");

const createOrder = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartResult = await client.query(
      `
      SELECT
        ci.product_id,
        ci.quantity,
        p.name,
        p.price,
        p.stock
      FROM cart_items ci
      JOIN products p
        ON ci.product_id = p.id
      WHERE ci.user_id = $1
      `,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    const cartItems = cartResult.rows;

    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.name}`,
        });
      }
    }

    const totalAmount = cartItems.reduce(
      (sum, item) =>
        sum + Number(item.price) * item.quantity,
      0
    );

    const orderResult = await client.query(
      `
      INSERT INTO orders
        (user_id, total_amount, status)
      VALUES
        ($1, $2, 'pending')
      RETURNING *
      `,
      [
        req.user.id,
        Number(totalAmount.toFixed(2)),
      ]
    );

    const order = orderResult.rows[0];

    for (const item of cartItems) {
      await client.query(
        `
        INSERT INTO order_items
          (order_id, product_id, quantity, price)
        VALUES
          ($1, $2, $3, $4)
        `,
        [
          order.id,
          item.product_id,
          item.quantity,
          item.price,
        ]
      );

      await client.query(
        `
        UPDATE products
        SET stock = stock - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
          item.quantity,
          item.product_id,
        ]
      );
    }

    await client.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    next(error);
  } finally {
    client.release();
  }
};


const getOrders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        total_amount,
        status,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      orders: result.rows,
    });
  } catch (error) {
    next(error);
  }
};


const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        total_amount,
        status,
        created_at,
        updated_at
      FROM orders
      WHERE id = $1
      AND user_id = $2
      `,
      [id, req.user.id]
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
        p.name,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) AS subtotal
      FROM order_items oi
      JOIN products p
        ON oi.product_id = p.id
      WHERE oi.order_id = $1
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    next(error);
  }
};



module.exports = {
  createOrder,
  getOrders,
  getOrderById,
};