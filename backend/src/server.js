const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");

// -------------------- ROUTES --------------------
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");

// -------------------- MIDDLEWARE --------------------
const errorHandler = require("./middleware/errorMiddleware");


// -------------------- APP --------------------
const app = express();

app.use(express.json());
app.use(cors());

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce API is running",
  });
});


// -------------------- PUBLIC / GENERAL ROUTES --------------------
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// -------------------- ADMIN ROUTES --------------------
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin", adminDashboardRoutes);   // ✅ FIXED — no double "dashboard"

// -------------------- ERROR HANDLER (must be last) --------------------
app.use(errorHandler);

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});