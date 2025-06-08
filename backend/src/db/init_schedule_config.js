const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function initScheduleConfig() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'schedule_config.sql'), 'utf8');
        await pool.query(sql);
        console.log('Schedule config table and sample data created successfully');
    } catch (error) {
        console.error('Error initializing schedule config:', error);
    } finally {
        process.exit();
    }
}

initScheduleConfig(); 