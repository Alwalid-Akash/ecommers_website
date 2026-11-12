// Creates all tables in the database the app uses (Neon, via DATABASE_URL).
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const pool = require('./db'); // same connection as the app

// Order matters: parent tables first
const SQL_FILES = ['schema.sql', 'cart_item.sql'];

async function initDb() {
  try {
    for (const fileName of SQL_FILES) {
      const filePath = path.join(__dirname, fileName);
      if (!fs.existsSync(filePath)) {
        throw new Error(`SQL file not found: ${filePath}`);
      }

      console.log(`⚙️  Executing ${fileName}...`);
      await pool.query(fs.readFileSync(filePath, 'utf8'));
      console.log(`✅ ${fileName} executed successfully!`);
    }
    console.log('🎉 All tables created successfully!');
  } catch (error) {
    console.error('❌ Error initializing database:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed.');
  }
}

initDb();
