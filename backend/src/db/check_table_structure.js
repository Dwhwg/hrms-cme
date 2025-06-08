const { pool } = require('../config/database');

async function checkTableStructure() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'schedule_config'
        `);
        console.log('Schedule config table structure:', result.rows);
    } catch (error) {
        console.error('Error checking table structure:', error);
    } finally {
        process.exit();
    }
}

checkTableStructure(); 