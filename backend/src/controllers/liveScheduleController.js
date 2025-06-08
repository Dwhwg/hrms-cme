const pool = require('../config/database');
const { validationResult } = require('express-validator');
const ExcelJS = require('exceljs');

// Auto generate schedule for a specific account
const autoGenerateSchedule = async (req, res) => {
    console.log('=== autoGenerateSchedule called ===');
    console.log('Request body:', req.body);
    
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { account_ids, start_date } = req.body;
        console.log('Processing request for account_ids:', account_ids, 'start_date:', start_date);
        
        if (!account_ids || !Array.isArray(account_ids) || account_ids.length === 0 || !start_date) {
            return res.status(400).json({
                success: false,
                message: 'Account IDs and start date are required'
            });
        }

        // Loop untuk setiap akun
        for (const account_id of account_ids) {
            // 1. Get account configuration langsung dari live_accounts
            const accountResult = await pool.query(
                'SELECT * FROM live_accounts WHERE id = $1',
                [account_id]
            );
            if (accountResult.rows.length === 0) {
                console.log('Account not found:', account_id);
                continue;
            }
            const account = accountResult.rows[0];

            // --- Tambahkan logika pembagian off day host ---
            // Ambil semua host yang assigned ke akun ini
            const hostResultForOffDay = await pool.query(
                'SELECT h.id, h.employee_id FROM hosts h JOIN host_account_assignment haa ON h.id = haa.host_id WHERE haa.account_id = $1',
                [account_id]
            );
            const hostIdsForOffDay = hostResultForOffDay.rows.map(r => r.id);
            console.log('DEBUG: Hosts assigned to account (' + account_id + ') for off day logic:', hostIdsForOffDay);
            for (const hostId of hostIdsForOffDay) {
                const offDay = Math.floor(Math.random() * 7); // 0-6
                for (let i = 0; i < 7; i++) {
                    const date = new Date(start_date);
                    date.setDate(date.getDate() + i);
                    await pool.query(
                        'INSERT INTO host_availability (host_id, date, is_available) VALUES ($1, $2, $3) ON CONFLICT (host_id, date) DO UPDATE SET is_available = EXCLUDED.is_available',
                        [hostId, date.toISOString().slice(0, 10), i === offDay ? false : true]
                    );
                }
            }
            // --- END logika off day host ---

            // 2. Create or get schedule batch
            const batchResult = await pool.query(
                `INSERT INTO schedule_batches (start_date, end_date)
                 VALUES ($1::date, $1::date + INTERVAL '6 days')
                 RETURNING id`,
                [start_date]
            );
            const batchId = batchResult.rows[0].id;

            // 3. Calculate slots (gunakan fungsi calculateSlots dengan data dari account)
            const slots = calculateSlots(account);
            console.log('Calculated slots:', slots); // Debug log
            if (!slots || slots.length === 0) {
                console.log('No valid time slots could be calculated for account:', account_id);
                continue;
            }

            // 4. Generate schedules for each day (lanjutkan logic lama)
            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(start_date);
                currentDate.setDate(currentDate.getDate() + i);
                for (const slot of slots) {
                    try {
                        // Find available host
                        const hostResult = await pool.query(
                            `SELECT h.id, h.employee_id 
                             FROM hosts h
                             JOIN host_availability ha ON h.id = ha.host_id
                             JOIN host_account_assignment haa ON h.id = haa.host_id
                             WHERE h.is_active = true
                             AND ha.date = $1
                             AND ha.is_available = true
                             AND haa.account_id = $2
                             AND NOT EXISTS (
                                 SELECT 1 FROM work_schedules ws
                                 WHERE ws.employee_id = h.employee_id
                                 AND ws.date = $1
                                 AND (
                                     (ws.start_time, ws.end_time) OVERLAPS ($3::time, $4::time)
                                 )
                             )`,
                            [currentDate, account_id, slot.start_time, slot.end_time]
                        );
                        console.log(`DEBUG: Host search result for ${currentDate.toISOString().slice(0, 10)} slot ${slot.start_time}-${slot.end_time} for account ${account_id}:`, hostResult.rows); // Detailed debug log
                        
                        if (hostResult.rows.length === 0) {
                            console.log(`No host available for date ${currentDate.toISOString().slice(0, 10)} and slot ${slot.start_time}-${slot.end_time} for account ${account_id}`);
                            continue;
                        }
                        
                        const selectedHost = hostResult.rows[Math.floor(Math.random() * hostResult.rows.length)];
                        const hostId = selectedHost.id;
                        const employeeId = selectedHost.employee_id; 
                        console.log('DEBUG: Selected Host:', { hostId, employeeId }); // New log

                        // Create work schedule
                        const workScheduleResult = await pool.query(
                            `INSERT INTO work_schedules 
                             (employee_id, position, date, start_time, end_time, schedule_type)
                             VALUES ($1, 'host', $2, $3, $4, 'live')
                             RETURNING id`,
                            [employeeId, currentDate, slot.start_time, slot.end_time] // Use employeeId here
                        );
                        console.log('Work schedule created:', workScheduleResult.rows[0]); // Debug log

                        // Find off_availability_id if host is marked as unavailable for this date
                        let offAvailabilityId = null;
                        const offAvailabilityResult = await pool.query(
                            'SELECT id FROM host_availability WHERE host_id = $1 AND date = $2 AND is_available = false',
                            [hostId, currentDate]
                        );
                        if (offAvailabilityResult.rows.length > 0) {
                            offAvailabilityId = offAvailabilityResult.rows[0].id;
                        }
                        console.log('Off availability ID:', offAvailabilityId); // Debug log
                        
                        // Create live schedule
                        const liveScheduleInsertResult = await pool.query(
                            `INSERT INTO live_schedules (account_id, batch_id, is_draft, date, start_time, end_time, host_id, off_availability_id)
                             VALUES ($1, $2, true, $3, $4, $5, $6, $7)`,
                            [account_id, batchId, currentDate, slot.start_time, slot.end_time, hostId, offAvailabilityId]
                        );
                        const liveScheduleId = liveScheduleInsertResult.rows[0].id;
                        console.log('Live schedule created:', liveScheduleInsertResult.rows[0]); // Debug log
                        
                        // If cohost is required, find and assign cohost
                        if (account.with_cohost) {
                            const cohostResult = await pool.query(
                                `SELECT e.id 
                                 FROM employees e
                                 WHERE e.position = 'cohost'
                                 AND NOT EXISTS (
                                     SELECT 1 FROM work_schedules ws
                                     WHERE ws.employee_id = e.id
                                     AND ws.date = $1
                                     AND (
                                         (ws.start_time, ws.end_time) OVERLAPS ($2::time, $3::time)
                                     )
                                 )
                                 LIMIT 1`,
                                [currentDate, slot.start_time, slot.end_time]
                            );
                            console.log(`Cohost search for ${currentDate} ${slot.start_time}-${slot.end_time}:`, cohostResult.rows); // Debug log
                            
                            if (cohostResult.rows.length > 0) {
                                // Ensure cohost_id is the employee.id of the cohost
                                await pool.query(
                                    `UPDATE live_schedules 
                                     SET cohost_id = $1
                                     WHERE id = $2`,
                                    [cohostResult.rows[0].id, liveScheduleId] // cohostResult.rows[0].id is already employee.id
                                );
                                console.log('Cohost assigned to live schedule'); // Debug log
                            } else {
                                console.log(`No cohost available for date ${currentDate.toISOString().slice(0, 10)} and slot ${slot.start_time}-${slot.end_time}`);
                            }
                        }
                    } catch (slotError) {
                        console.error(`Error processing slot for date ${currentDate.toISOString().slice(0, 10)}:`, slotError);
                        continue;
                    }
                }
            }
        }
        res.json({
            success: true,
            message: 'Schedule generated successfully for all selected accounts'
        });
    } catch (error) {
        console.error('Error in autoGenerateSchedule:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while generating schedule',
            error: error.message
        });
    }
};

// Helper function to calculate slots
const calculateSlots = (account) => {
    const slots = [];
    const slotDuration = account.switch_host_every; // This is now in HOURS
    
    let currentTime = new Date(`2000-01-01 ${account.start_time}`);
    const endTime = new Date(`2000-01-01 ${account.end_time}`);
    
    while (currentTime < endTime) {
        // Corrected to add hours (slotDuration is in hours)
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 60 * 1000); 
        if (slotEnd > endTime) break;
        
        slots.push({
            start_time: currentTime.toTimeString().slice(0, 5),
            end_time: slotEnd.toTimeString().slice(0, 5)
        });
        
        currentTime = slotEnd;
    }
    
    return slots;
};

// Get all live schedules
const getLiveSchedules = async (req, res) => {
    console.log('=== getLiveSchedules called ===');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors in getLiveSchedules:', errors.array());
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { accountId, date } = req.query;
    console.log('Received query params - accountId:', accountId, ', date:', date);
    let query = `
        SELECT
            ls.id AS schedule_id,
            ls.batch_id,
            ls.is_draft,
            la.id AS account_id,
            la.account_name,
            la.platform,
            ls.date AS schedule_date,
            ls.start_time,
            ls.end_time,
            h.name AS host_name,
            ch.name AS cohost_name
        FROM
            live_schedules ls
        JOIN
            live_accounts la ON ls.account_id = la.id
        JOIN
            hosts ho ON ls.host_id = ho.id
        JOIN
            employees h ON ho.employee_id = h.id
        LEFT JOIN
            employees ch ON ls.co_host_id = ch.id
        WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (accountId) {
        // If accountId is an array, use IN clause
        if (Array.isArray(accountId)) {
            query += ` AND ls.account_id IN (${accountId.map(() => `\$${paramIndex++}`).join(', ')})`;
            queryParams.push(...accountId);
        } else {
            // If accountId is a single value
            query += ` AND ls.account_id = $${paramIndex++}`;
            queryParams.push(accountId);
        }
    }
    if (date) {
        query += ` AND ls.date = $${paramIndex++}`;
        queryParams.push(date);
    }

    console.log('Constructed SQL query:', query);
    console.log('Query parameters:', queryParams);

    query += ` ORDER BY ls.date, ls.start_time`;

    try {
        const result = await pool.query(query, queryParams);
        console.log('Query result rows:', result.rows);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error fetching live schedules:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch live schedules' });
    }
};

// Download live schedules as Excel
const downloadLiveSchedulesExcel = async (req, res) => {
    console.log('=== downloadLiveSchedulesExcel called ===');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { accountId, date } = req.query;
    let query = `
        SELECT
            ls.id AS schedule_id,
            la.account_name,
            la.platform,
            ls.date AS schedule_date,
            ls.start_time,
            ls.end_time,
            h.name AS host_name,
            ch.name AS cohost_name
        FROM
            live_schedules ls
        JOIN
            live_accounts la ON ls.account_id = la.id
        JOIN
            hosts ho ON ls.host_id = ho.id
        JOIN
            employees h ON ho.employee_id = h.id
        LEFT JOIN
            employees ch ON ls.co_host_id = ch.id
        WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (accountId) {
        if (Array.isArray(accountId)) {
            query += ` AND ls.account_id IN (${accountId.map(() => `$${paramIndex++}`).join(', ')})`;
            queryParams.push(...accountId);
        } else {
            query += ` AND ls.account_id = $${paramIndex++}`;
            queryParams.push(accountId);
        }
    }
    if (date) {
        query += ` AND ls.date = $${paramIndex++}`;
        queryParams.push(date);
    }

    query += ` ORDER BY ls.date, ls.start_time`;

    try {
        const result = await pool.query(query, queryParams);
        const schedules = result.rows;

        // Create a new workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Live Schedules');

        // Define columns
        worksheet.columns = [
            { header: 'No.', key: 'no', width: 5 },
            { header: 'Date', key: 'schedule_date', width: 15 },
            { header: 'Time', key: 'time', width: 15 },
            { header: 'Platform', key: 'platform', width: 20 },
            { header: 'Account Name', key: 'account_name', width: 30 },
            { header: 'Host Name', key: 'host_name', width: 25 },
            { header: 'Cohost Name', key: 'cohost_name', width: 25 }
        ];

        // Add rows
        schedules.forEach((schedule, index) => {
            worksheet.addRow({
                no: index + 1,
                schedule_date: format(new Date(schedule.schedule_date), 'dd/MM/yyyy'),
                time: `${schedule.start_time} - ${schedule.end_time}`,
                platform: schedule.platform,
                account_name: schedule.account_name,
                host_name: schedule.host_name,
                cohost_name: schedule.cohost_name || '-'
            });
        });

        // Set response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Live_Schedules_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error generating Excel file:', err);
        res.status(500).json({ success: false, message: 'Failed to generate Excel file' });
    }
};

// Update schedule draft status
const updateScheduleStatus = async (req, res) => {
    console.log('=== updateScheduleStatus called ===');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { batch_id } = req.params;
    const { is_draft } = req.body;

    try {
        const result = await pool.query(
            'UPDATE live_schedules SET is_draft = $1 WHERE batch_id = $2 RETURNING *'
        );
        res.json({
            success: true,
            message: 'Schedule status updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    autoGenerateSchedule,
    getLiveSchedules,
    downloadLiveSchedulesExcel,
    updateScheduleStatus
}; 