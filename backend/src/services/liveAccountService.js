const db = require('../config/database');

class LiveAccountService {
    async createAccount(accountData) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                `INSERT INTO live_accounts (
                    account_name, account_code, platform, location,
                    start_time, end_time, duration, slot_qty,
                    switch_host_every, total_host_by_day, with_cohost
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *`,
                [
                    accountData.account_name,
                    accountData.account_code,
                    accountData.platform,
                    accountData.location,
                    accountData.start_time,
                    accountData.end_time,
                    accountData.duration,
                    accountData.slot_qty,
                    accountData.switch_host_every,
                    accountData.total_host_by_day,
                    accountData.with_cohost
                ]
            );
            
            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database error in createAccount:', error);
            throw new Error('Failed to create live account: ' + error.message);
        } finally {
            client.release();
        }
    }

    async getAllAccounts() {
        try {
            const result = await db.query('SELECT * FROM live_accounts ORDER BY account_name');
            return result.rows;
        } catch (error) {
            console.error('Database error in getAllAccounts:', error);
            throw new Error('Failed to fetch live accounts: ' + error.message);
        }
    }

    async getAccountById(id) {
        try {
            const result = await db.query('SELECT * FROM live_accounts WHERE id = $1', [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Database error in getAccountById:', error);
            throw new Error('Failed to fetch live account: ' + error.message);
        }
    }

    async updateAccount(id, accountData) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            const result = await client.query(
                `UPDATE live_accounts SET
                    account_name = $1,
                    account_code = $2,
                    platform = $3,
                    location = $4,
                    start_time = $5,
                    end_time = $6,
                    duration = $7,
                    slot_qty = $8,
                    switch_host_every = $9,
                    total_host_by_day = $10,
                    with_cohost = $11
                WHERE id = $12
                RETURNING *`,
                [
                    accountData.account_name,
                    accountData.account_code,
                    accountData.platform,
                    accountData.location,
                    accountData.start_time,
                    accountData.end_time,
                    accountData.duration,
                    accountData.slot_qty,
                    accountData.switch_host_every,
                    accountData.total_host_by_day,
                    accountData.with_cohost,
                    id
                ]
            );
            
            await client.query('COMMIT');
            return result.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database error in updateAccount:', error);
            throw new Error('Failed to update live account: ' + error.message);
        } finally {
            client.release();
        }
    }

    async deleteAccount(id) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM live_accounts WHERE id = $1', [id]);
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database error in deleteAccount:', error);
            throw new Error('Failed to delete live account: ' + error.message);
        } finally {
            client.release();
        }
    }
}

module.exports = new LiveAccountService(); 