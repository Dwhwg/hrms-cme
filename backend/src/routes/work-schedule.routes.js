const express = require('express');
const router = express.Router();
const workScheduleController = require('../controllers/work-schedule.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.auth);

// Create a new work schedule
router.post('/', workScheduleController.create);

// Get all work schedules with filtering and pagination
router.get('/', workScheduleController.findAll);

// Get employees filtered by position - 必须在参数路由前定义
router.get('/employees/by-position', workScheduleController.getEmployeesByPosition);

// Get a single work schedule by id
router.get('/:id', workScheduleController.findOne);

// Update a work schedule
router.put('/:id', workScheduleController.update);

// Delete a work schedule
router.delete('/:id', workScheduleController.delete);

module.exports = router; 