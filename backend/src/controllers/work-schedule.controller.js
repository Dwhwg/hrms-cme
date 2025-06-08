const WorkSchedule = require('../models/work-schedule.model');
const Employee = require('../models/employee.model');
const db = require('../config/database');

// Create a new work schedule
exports.create = async (req, res) => {
  try {
    console.log('Creating work schedule with user:', req.user); // Debug log
    
    const {
      position,
      position_id,
      employee_id,
      start_date,
      end_date,
      start_time,
      end_time,
      office_location_id,
      include_off_day,
      off_day_date,
      live_account_id
    } = req.body;

    // Convert boolean to 'yes'/'no' string for include_off_day
    const formattedIncludeOffDay = include_off_day ? 'yes' : 'no';

    // Ensure time format includes seconds
    const formattedStartTime = start_time.includes(':') ? 
      (start_time.split(':').length === 2 ? `${start_time}:00` : start_time) : 
      `${start_time}:00:00`;
    
    const formattedEndTime = end_time.includes(':') ? 
      (end_time.split(':').length === 2 ? `${end_time}:00` : end_time) : 
      `${end_time}:00:00`;

    // Ensure created_by is set
    if (!req.user || !req.user.id) {
      throw new Error('User information not available');
    }

    const workSchedule = await WorkSchedule.create({
      position,
      position_id,
      employee_id,
      start_date,
      end_date,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      office_location_id,
      include_off_day: formattedIncludeOffDay,
      off_day_date,
      live_account_id,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      data: workSchedule
    });
  } catch (error) {
    console.error('Error creating work schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating work schedule',
      error: error.message
    });
  }
};

// Get all work schedules with pagination and filtering
exports.findAll = async (req, res) => {
  try {
    console.log('Fetching work schedules with query params:', req.query);
    
    // Parse query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build filter object
    const filters = {
      position: req.query.position || null,
      employee_id: req.query.employee_id || null,
      start_date: req.query.start_date || null,
      end_date: req.query.end_date || null,
      live_account_id: req.query.account || null,
      status: req.query.status || null,
      limit,
      offset
    };
    
    // Count total matching records for pagination
    const total = await WorkSchedule.countAll(filters);
    
    // Get filtered records
    const schedules = await WorkSchedule.findAll(filters);
    
    res.status(200).json({
      message: 'Work schedules retrieved successfully',
      data: schedules,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching work schedules:', error);
    res.status(500).json({ message: 'Failed to fetch work schedules', error: error.message });
  }
};

// Get a single work schedule by ID
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const schedule = await WorkSchedule.findById(id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Work schedule not found' });
    }
    
    res.status(200).json({
      message: 'Work schedule retrieved successfully',
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching work schedule:', error);
    res.status(500).json({ message: 'Failed to fetch work schedule', error: error.message });
  }
};

// Update a work schedule
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if schedule exists
    const existingSchedule = await WorkSchedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({ message: 'Work schedule not found' });
    }
    
    // If position is "Host Live Streaming", require live_account_id
    if (req.body.position === 'Host Live Streaming' && !req.body.live_account_id) {
      return res.status(400).json({ message: 'Live account is required for Host Live Streaming position' });
    }
    
    // Update the schedule
    const updatedSchedule = await WorkSchedule.update(id, req.body);
    
    res.status(200).json({
      message: 'Work schedule updated successfully',
      data: updatedSchedule
    });
  } catch (error) {
    console.error('Error updating work schedule:', error);
    res.status(500).json({ message: 'Failed to update work schedule', error: error.message });
  }
};

// Delete a work schedule
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if schedule exists
    const existingSchedule = await WorkSchedule.findById(id);
    if (!existingSchedule) {
      return res.status(404).json({ message: 'Work schedule not found' });
    }
    
    // Delete the schedule
    await WorkSchedule.delete(id);
    
    res.status(200).json({
      message: 'Work schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting work schedule:', error);
    res.status(500).json({ message: 'Failed to delete work schedule', error: error.message });
  }
};

// Get employees filtered by position
exports.getEmployeesByPosition = async (req, res) => {
  try {
    const position = req.query.position;
    
    let employees;
    if (position && position !== 'all') {
      // Get employees by position
      const query = `
        SELECT id, name, position, department 
        FROM employees 
        WHERE position = $1 
        ORDER BY name ASC
      `;
      const result = await db.query(query, [position]);
      employees = result.rows;
    } else {
      // Get all employees
      employees = await Employee.findAll();
    }
    
    res.status(200).json({
      message: 'Employees retrieved successfully',
      data: employees
    });
  } catch (error) {
    console.error('Error fetching employees by position:', error);
    res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
}; 