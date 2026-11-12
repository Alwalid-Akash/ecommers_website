const { Pool } = require("pg");
require("dotenv").config();

// One shared connection pool for the whole app.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon requires SSL
});

module.exports = pool;
