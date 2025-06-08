const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/attendance.controller');
const { auth } = require('../middleware/auth.middleware');
const upload = require('../config/multer');

// 打卡路由
router.post('/clock-in', auth, upload.single('photo'), (req, res) => {
  AttendanceController.clockIn(req, res);
});

router.post('/clock-out', auth, upload.single('photo'), (req, res) => {
  AttendanceController.clockOut(req, res);
});

// 获取打卡记录路由
router.get('/', auth, (req, res) => {
  AttendanceController.getAttendanceHistory(req, res);
});

router.get('/today/:employeeId', auth, (req, res) => {
  AttendanceController.getTodayAttendance(req, res);
});

// Get last attendance route
router.get('/last/:employeeId', auth, (req, res) => {
  AttendanceController.getLastAttendance(req, res);
});

module.exports = router; 