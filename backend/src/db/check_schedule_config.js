const { pool } = require('../config/database');

async function checkScheduleConfig() {
    try {
        const result = await pool.query('SELECT * FROM schedule_config');
        console.log('Schedule config data:', result.rows);
    } catch (error) {
        console.error('Error checking schedule config:', error);
    } finally {
        process.exit();
    }
}

checkScheduleConfig(); 