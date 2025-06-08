const { pool } = require('../config/database');

async function insertScheduleConfig() {
    try {
        const result = await pool.query(`
            INSERT INTO schedule_config (
                account_id,
                min_hours_per_day,
                max_hours_per_day,
                max_hours_per_week,
                max_shift_per_day,
                require_cohost,
                cohost_rotation_method
            ) VALUES 
            (1, 4, 8, 40, 2, true, 'alternate'),
            (2, 4, 8, 40, 2, false, 'alternate'),
            (3, 4, 8, 40, 2, true, 'alternate')
            RETURNING *
        `);
        console.log('Schedule config data inserted:', result.rows);
    } catch (error) {
        console.error('Error inserting schedule config:', error);
    } finally {
        process.exit();
    }
}

insertScheduleConfig(); 