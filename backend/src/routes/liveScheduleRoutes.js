const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const liveScheduleController = require('../controllers/liveScheduleController');

// Auto generate schedule
router.post('/auto-generate',
    [
        body('account_ids')
            .isArray({ min: 1 }).withMessage('Account IDs must be an array of numbers')
            .custom(arr => arr.every(v => !isNaN(Number(v)))).withMessage('Account IDs must be an array of numbers'),
        body('start_date').isDate().withMessage('Start date must be a valid date')
    ],
    liveScheduleController.autoGenerateSchedule
);

// Get live schedules
router.get('/',
    [
        query('accountId')
            .optional()
            .customSanitizer(value => Array.isArray(value) ? value : value ? [value] : [])
            .isArray().withMessage('Account ID must be an array of numbers')
            .custom(arr => arr.every(v => !isNaN(Number(v)))).withMessage('Account ID must be an array of numbers'),
        query('date').optional().isDate().withMessage('Date must be a valid date')
    ],
    liveScheduleController.getLiveSchedules
);

// Download live schedules as Excel
router.get('/download-excel',
    [
        query('accountId')
            .optional()
            .customSanitizer(value => Array.isArray(value) ? value : value ? [value] : [])
            .isArray().withMessage('Account ID must be an array of numbers')
            .custom(arr => arr.every(v => !isNaN(Number(v)))).withMessage('Account ID must be an array of numbers'),
        query('date').optional().isDate().withMessage('Date must be a valid date')
    ],
    liveScheduleController.downloadLiveSchedulesExcel
);

// Update schedule status
router.patch('/:batch_id/status',
    [
        param('batch_id').isInt().withMessage('Batch ID must be a number'),
        body('is_draft').isBoolean().withMessage('Is draft must be a boolean')
    ],
    liveScheduleController.updateScheduleStatus
);

module.exports = router; 