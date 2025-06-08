const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Pastikan password adalah string
const dbPassword = process.env.DB_PASSWORD ? process.env.DB_PASSWORD.toString() : '';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: dbPassword,
  port: parseInt(process.env.DB_PORT),
  ssl: false // Nonaktifkan SSL untuk development
});

async function runUpdate() {
  let client;
  try {
    // Mendapatkan koneksi client
    client = await pool.connect();
    console.log('Terhubung ke database');

    // Membaca file SQL
    const sqlPath = path.join(__dirname, 'update_live_accounts.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Menjalankan SQL
    await client.query(sqlContent);
    console.log('Update database berhasil');
  } catch (error) {
    console.error('Error saat update database:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runUpdate(); 