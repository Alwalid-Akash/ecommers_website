// Load environment variables
require('dotenv').config();

// Import PostgreSQL client
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Main function to create tables
async function initDb() {
  try {
    console.log('🔄 Connecting to database...');

    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Reading schema.sql...');

    // Execute the SQL
    await pool.query(sql);

    console.log('✅ Tables created successfully!');

    // Close connection
    await pool.end();

  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

// Run the function
initDb();