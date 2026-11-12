// Creates an admin account and some sample data so anyone can try the app.
// Safe to run more than once: existing rows are left alone.
//
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me-123 npm run db:seed
require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const categories = [
  { name: "Electronics", description: "Phones, laptops and accessories" },
  { name: "Books", description: "Fiction and non-fiction" },
  { name: "Home", description: "Kitchen and household items" },
];

const products = [
  { name: "Wireless Headphones", price: 79.99, stock: 25, category: "Electronics" },
  { name: "USB-C Charger 65W", price: 34.5, stock: 40, category: "Electronics" },
  { name: "Clean Code", price: 29.9, stock: 15, category: "Books" },
  { name: "Ceramic Coffee Mug", price: 12.0, stock: 60, category: "Home" },
];

async function seed() {
  try {
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      if (ADMIN_PASSWORD.length < 8) {
        throw new Error("ADMIN_PASSWORD must be at least 8 characters");
      }
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await pool.query(
        `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, 'admin')
        ON CONFLICT (email) DO UPDATE SET role = 'admin'
        `,
        [ADMIN_NAME, ADMIN_EMAIL, hash]
      );
      console.log(`👤 Admin ready: ${ADMIN_EMAIL}`);
    } else {
      console.log("ℹ️  ADMIN_EMAIL / ADMIN_PASSWORD not set: skipping admin user.");
    }

    for (const category of categories) {
      await pool.query(
        `
        INSERT INTO categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        `,
        [category.name, category.description]
      );
    }

    for (const product of products) {
      await pool.query(
        `
        INSERT INTO products (name, price, stock, category_id)
        SELECT $1, $2, $3, c.id
        FROM categories c
        WHERE c.name = $4
          AND NOT EXISTS (SELECT 1 FROM products WHERE name = $1)
        `,
        [product.name, product.price, product.stock, product.category]
      );
    }

    console.log("🌱 Seed data ready.");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
