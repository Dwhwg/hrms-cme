const Attendance = require('../models/attendance.model');
const Employee = require('../models/employee.model');
const OfficeLocation = require('../models/officeLocation.model');

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球半径，单位：公里
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1000; // 转换为米
  return distance;
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

const AttendanceController = {
  async clockIn(req, res) {
    try {
      const { employeeId, latitude, longitude, accuracy } = req.body;
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      // 检查位置数据是否有效
      if (!latitude || !longitude) {
        return res.status(400).json({ message: '位置数据无效，请重新获取位置' });
      }
      
      // 验证员工是否存在
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: '未找到员工信息' });
      }
      
      // 如果位置精度过低，记录警告但不拒绝请求
      let accuracyWarning = '';
      if (accuracy && accuracy > 200) {
        accuracyWarning = `警告：位置精度较低(${Math.round(accuracy)}米)`;
        console.warn(`位置精度低：员工ID ${employeeId}, 精度 ${Math.round(accuracy)}米`);
      }

      // 检查是否已经在办公室范围内
      const officeLocations = await OfficeLocation.findAll();
      let isInOffice = false;
      let closestDistance = Infinity;
      let closestOfficeName = '';
      
      for (const location of officeLocations) {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(location.latitude),
          parseFloat(location.longitude)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestOfficeName = location.name;
        }
        
        if (distance <= location.radius) {
          isInOffice = true;
          break;
        }
      }

      if (!isInOffice) {
        let errorMsg = '您不在办公区域内';
        if (closestOfficeName) {
          errorMsg += `，最近的办公地点是 ${closestOfficeName}，距离约 ${Math.round(closestDistance)} 米`;
        }
        if (accuracy && accuracy > 100) {
          errorMsg += `。当前位置精度是 ${Math.round(accuracy)} 米，精度较低可能导致位置识别错误。`;
        }
        return res.status(400).json({ message: errorMsg });
      }

      // 检查是否已经打卡
      const lastAttendance = await Attendance.findLastByEmployeeId(employeeId);
      if (lastAttendance && lastAttendance.type === 'IN' && 
          new Date(lastAttendance.created_at).toDateString() === new Date().toDateString()) {
        return res.status(400).json({ message: '您今天已经打过卡了' });
      }

      // 创建打卡记录
      const attendance = await Attendance.create(employeeId, 'IN', latitude, longitude, photoUrl);
      
      // 如果有精度警告，添加到响应中
      if (accuracyWarning) {
        attendance.warning = accuracyWarning;
      }
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error('打卡错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  },

  async clockOut(req, res) {
    try {
      const { employeeId, latitude, longitude, accuracy } = req.body;
      const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
      
      // 检查位置数据是否有效
      if (!latitude || !longitude) {
        return res.status(400).json({ message: '位置数据无效，请重新获取位置' });
      }
      
      // 验证员工是否存在
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: '未找到员工信息' });
      }
      
      // 如果位置精度过低，记录警告但不拒绝请求
      let accuracyWarning = '';
      if (accuracy && accuracy > 200) {
        accuracyWarning = `警告：位置精度较低(${Math.round(accuracy)}米)`;
        console.warn(`位置精度低：员工ID ${employeeId}, 精度 ${Math.round(accuracy)}米`);
      }

      // 检查是否已经在办公室范围内
      const officeLocations = await OfficeLocation.findAll();
      let isInOffice = false;
      let closestDistance = Infinity;
      let closestOfficeName = '';
      
      for (const location of officeLocations) {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          parseFloat(location.latitude),
          parseFloat(location.longitude)
        );
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestOfficeName = location.name;
        }
        
        if (distance <= location.radius) {
          isInOffice = true;
          break;
        }
      }

      if (!isInOffice) {
        let errorMsg = '您不在办公区域内';
        if (closestOfficeName) {
          errorMsg += `，最近的办公地点是 ${closestOfficeName}，距离约 ${Math.round(closestDistance)} 米`;
        }
        if (accuracy && accuracy > 100) {
          errorMsg += `。当前位置精度是 ${Math.round(accuracy)} 米，精度较低可能导致位置识别错误。`;
        }
        return res.status(400).json({ message: errorMsg });
      }

      // 检查是否已经打卡
      const lastAttendance = await Attendance.findLastByEmployeeId(employeeId);
      if (!lastAttendance || lastAttendance.type === 'OUT') {
        return res.status(400).json({ message: '您需要先打卡上班' });
      }

      // 创建打卡记录
      const attendance = await Attendance.create(employeeId, 'OUT', latitude, longitude, photoUrl);
      
      // 如果有精度警告，添加到响应中
      if (accuracyWarning) {
        attendance.warning = accuracyWarning;
      }
      
      res.status(201).json(attendance);
    } catch (error) {
      console.error('签退错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  },

  async getAttendanceHistory(req, res) {
    try {
      const { department, month, year, type } = req.query;
      const { role, employeeId } = req.user; // Get user role and employeeId from auth middleware
      
      console.log('Fetching attendance history with filters:', { department, month, year, type });
      
      // Validate month
      if (month) {
        const monthNum = parseInt(month);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return res.status(400).json({ error: 'Invalid month' });
        }
      }
      
      // Validate year
      if (year) {
        const yearNum = parseInt(year);
        if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
          return res.status(400).json({ error: 'Invalid year' });
        }
      }
      
      // Validate type
      if (type && type !== 'IN' && type !== 'OUT') {
        return res.status(400).json({ error: 'Invalid attendance type' });
      }
      
      // Prepare filters
      const filters = { month, year, type };
      
      // If user is employee, they can only see their own attendance
      if (role === 'employee') {
        filters.employeeId = employeeId;
      } else if (department && department !== 'all') {
        // Only admin/manager can filter by department
        filters.department = department;
      }
      
      console.log('Applying filters:', filters);
      
      const attendances = await Attendance.findByDepartmentWithFilters(filters);
      console.log('Query result:', attendances.length, 'records');
      
      res.json(attendances);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('Failed to fetch attendance records')) {
        return res.status(500).json({ 
          error: error.message,
          details: error.stack
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch attendance history',
        details: error.message
      });
    }
  },

  async getTodayAttendance(req, res) {
    try {
      const { employeeId } = req.params;
      const attendance = await Attendance.findTodayByEmployeeId(employeeId);
      res.json(attendance);
    } catch (error) {
      console.error('获取今日考勤错误:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
  }
};

module.exports = AttendanceController; 