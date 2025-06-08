const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hrms_cme',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    // Connection settings
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20
});

// Test database connection
async function testConnection() {
    let retries = 5;
    while (retries > 0) {
        try {
            const client = await pool.connect();
            console.log('Successfully connected to database');
            client.release();
            return true;
        } catch (err) {
            console.error('Error connecting to database:', err);
            retries--;
            if (retries === 0) {
                console.error('Failed to connect to database after multiple attempts');
                process.exit(1);
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Initialize connection
testConnection();

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool
}; 