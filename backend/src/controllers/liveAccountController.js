const liveAccountService = require('../services/liveAccountService');

class LiveAccountController {
    async createAccount(req, res) {
        try {
            const accountData = req.body;
            
            // Validate required fields
            const requiredFields = [
                'account_name', 'account_code', 'platform', 'location',
                'start_time', 'end_time', 'duration', 'slot_qty',
                'switch_host_every', 'total_host_by_day'
            ];
            
            for (const field of requiredFields) {
                if (!accountData[field]) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} is required`
                    });
                }
            }

            const account = await liveAccountService.createAccount(accountData);
            
            return res.status(201).json({
                success: true,
                message: 'Live account created successfully',
                data: account
            });
        } catch (error) {
            console.error('Error in createAccount controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to create live account',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async getAllAccounts(req, res) {
        console.log('Received request to get all live accounts');
        try {
            const accounts = await liveAccountService.getAllAccounts();
            
            return res.status(200).json({
                success: true,
                data: accounts
            });
        } catch (error) {
            console.error('Error in getAllAccounts controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch live accounts',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async getAccountById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid account ID'
                });
            }

            const account = await liveAccountService.getAccountById(id);
            
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Live account not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: account
            });
        } catch (error) {
            console.error('Error in getAccountById controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch live account',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async updateAccount(req, res) {
        try {
            const { id } = req.params;
            const accountData = req.body;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid account ID'
                });
            }

            const account = await liveAccountService.updateAccount(id, accountData);
            
            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Live account not found'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Live account updated successfully',
                data: account
            });
        } catch (error) {
            console.error('Error in updateAccount controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update live account',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    async deleteAccount(req, res) {
        try {
            const { id } = req.params;

            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid account ID'
                });
            }

            await liveAccountService.deleteAccount(id);
            
            return res.status(200).json({
                success: true,
                message: 'Live account deleted successfully'
            });
        } catch (error) {
            console.error('Error in deleteAccount controller:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete live account',
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
}

module.exports = new LiveAccountController(); 