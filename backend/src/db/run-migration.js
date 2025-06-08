const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function runMigration() {
  try {
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'migrations', 'add_columns_to_live_accounts.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // 执行 SQL
    await pool.query(sqlContent);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration(); 