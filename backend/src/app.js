// Builds and configures the Express app WITHOUT starting it.
// server.js starts it; tests import it directly.
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// Behind Render's proxy: use the real client IP (needed for rate limiting).
app.set("trust proxy", 1);

// CORS: only allow the frontend origins listed in CORS_ORIGIN
// (comma-separated, e.g. "https://myshop.vercel.app,http://localhost:5173").
// If it isn't set, all origins are allowed (fine for local development).
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0 && process.env.NODE_ENV === "production") {
  console.warn("⚠️  CORS_ORIGIN is not set: the API accepts requests from any origin.");
}

app.use(cors(allowedOrigins.length > 0 ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: "100kb" }));

// -------------------- HEALTH CHECKS --------------------
app.get("/", (req, res) => {
  res.json({ success: true, message: "E-commerce API is running" });
});

// Also checks the database, so monitoring notices if Neon is unreachable.
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ success: false, status: "error", database: "unreachable" });
  }
});

// -------------------- ROUTES --------------------
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin", adminDashboardRoutes);

// AI shopping assistant (Gemini + read-only product tools)
app.use("/api/assistant", assistantRoutes);

// Unknown routes → JSON 404 instead of Express's HTML page
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Must be last: catches errors passed to next(error)
app.use(errorHandler);

module.exports = app;
