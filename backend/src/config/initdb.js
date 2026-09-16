// Load environment variables
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');

const DB_NAME = process.env.DB_NAME;

// Order matters: parent tables first
const SQL_FILES = ['schema.sql', 'cart_item.sql'];

// Step 1: Ensure the target database exists
async function ensureDatabaseExists() {
  const adminClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // default admin DB
  });

  await adminClient.connect();

  const { rowCount } = await adminClient.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [DB_NAME]
  );

  if (rowCount === 0) {
    console.log(`🛠  Database "${DB_NAME}" not found. Creating it...`);
    // Identifiers can't be parameterized — quote it safely
    await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`✅ Database "${DB_NAME}" created.`);
  } else {
    console.log(`ℹ️  Database "${DB_NAME}" already exists.`);
  }

  await adminClient.end();
}

// Step 2: Connect to the target DB and run the SQL files
async function runSqlFiles() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    for (const fileName of SQL_FILES) {
      const filePath = path.join(__dirname, fileName);

      if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
      }

      console.log(`📄 Reading ${fileName}...`);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`⚙️  Executing ${fileName}...`);
      await pool.query(sql);
      console.log(`✅ ${fileName} executed successfully!`);
    }

    console.log('🎉 All tables created successfully!');
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed.');
  }
}

async function initDb() {
  try {
    await ensureDatabaseExists();
    await runSqlFiles();
  } catch (error) {
    console.error('❌ Error initializing database:');
    console.error(error);
    process.exitCode = 1;
  }
}

initDb();