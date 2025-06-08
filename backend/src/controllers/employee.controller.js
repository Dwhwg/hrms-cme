const Employee = require('../models/employee.model');
const User = require('../models/user.model');
const Host = require('../models/host.model');
const db = require('../config/database');

const employeeController = {
  // Create new employee
  create: async (req, res) => {
    try {
      const { name, position, department, user_id, supervisor_id } = req.body;
      
      // Validate required fields
      if (!name || !position || !department) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // 如果提供了user_id，使用提供的user_id，否则使用当前登录用户的id
      const employeeUserId = user_id || req.user.id;

      const employee = await Employee.create({
        user_id: employeeUserId,
        name,
        position,
        department,
        supervisor_id: supervisor_id || null
      });
      
      // Add synchronization logic for hosts
      if (position === 'Host Live Streaming') {
        try {
          let host = await Host.findByEmployeeId(employee.id);
          if (host) {
            // Update existing host if necessary (e.g., set is_active to true)
            await Host.update(host.id, { is_active: true }); // Assuming Host model has an update method
            console.log(`Updated host for employee ${employee.id}`);
          } else {
            // Create new host record
            await Host.create({ employee_id: employee.id, is_active: true }); // Assuming Host model has a create method
            console.log(`Created host for employee ${employee.id}`);
          }
        } catch (hostError) {
          console.error('Error syncing employee to hosts table:', hostError);
          // Decide how to handle this error - maybe log and continue, or return error
          // For now, just log and continue to avoid blocking employee creation
        }
      }

      res.status(201).json(employee);
    } catch (error) {
      console.error('Error in employeeController.create:', error);
      res.status(500).json({ error: 'Failed to create employee' });
    }
  },

  // Get all employees
  getAll: async (req, res) => {
    try {
      const employees = await Employee.findAll();
      res.json(employees);
    } catch (error) {
      console.error('Error in employeeController.getAll:', error);
      res.status(500).json({ error: 'Failed to fetch employees' });
    }
  },

  // Get employee by ID
  getById: async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error) {
      console.error('Error in employeeController.getById:', error);
      res.status(500).json({ error: 'Failed to fetch employee' });
    }
  },

  // Update employee
  update: async (req, res) => {
    try {
      const { name, position, department, supervisor_id } = req.body;
      
      // Validate required fields
      if (!name || !position || !department) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const employee = await Employee.update(req.params.id, {
        name,
        position,
        department,
        supervisor_id: supervisor_id || null
      });
      
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      // Add synchronization logic for hosts on update
      if (position === 'Host Live Streaming') {
         try {
           let host = await Host.findByEmployeeId(employee.id);
           if (host) {
             // Update existing host if necessary (e.g., set is_active to true)
             await Host.update(host.id, { is_active: true }); // Assuming Host model has an update method
             console.log(`Updated host for employee ${employee.id} on update`);
           } else {
             // Create new host record
             await Host.create({ employee_id: employee.id, is_active: true }); // Assuming Host model has a create method
             console.log(`Created host for employee ${employee.id} on update`);
           }
         } catch (hostError) {
           console.error('Error syncing employee to hosts table on update:', hostError);
           // Decide how to handle this error
         }
      } else { // If position is not Host Live Streaming, deactivate or remove from hosts table
        try {
          let host = await Host.findByEmployeeId(employee.id);
          if (host) {
             // Deactivate host if not Host Live Streaming
             await Host.update(host.id, { is_active: false }); // Assuming Host model has an update method
             console.log(`Deactivated host for employee ${employee.id} due to position change`);
          }
        } catch (hostError) {
           console.error('Error deactivating host for employee:', hostError);
           // Decide how to handle this error
        }
      }

      res.json(employee);
    } catch (error) {
      console.error('Error in employeeController.update:', error);
      res.status(500).json({ error: 'Failed to update employee' });
    }
  },

  // Delete employee
  delete: async (req, res) => {
    try {
      // Find the employee first to get the user_id
      const employeeToDelete = await Employee.findById(req.params.id);
      if (!employeeToDelete) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Delete associated host if exists
      try {
        let host = await Host.findByEmployeeId(employeeToDelete.id);
        if (host) {
          await Host.delete(host.id); // Assuming Host model has a delete method
          console.log(`Deleted host for employee ${employeeToDelete.id}`);
        }
      } catch (hostError) {
         console.error('Error deleting host for employee:', hostError);
         // Continue with employee deletion even if host deletion fails
      }

      // Delete the employee record
      const employee = await Employee.delete(req.params.id);
      
      // Delete associated user if user_id exists
      if (employeeToDelete.user_id) {
        try {
          await User.delete(employeeToDelete.user_id); // Assuming User model has a delete method
          console.log(`Deleted user ${employeeToDelete.user_id} for employee ${employeeToDelete.id}`);
        } catch (userError) {
          console.error('Error deleting associated user:', userError);
          // Continue with response even if user deletion fails
        }
      }

      res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
      console.error('Error in employeeController.delete:', error);
      res.status(500).json({ error: 'Failed to delete employee' });
    }
  },

  // Delete host
  deleteHost: async (req, res) => {
    try {
      const hostId = req.params.id;
      const deletedHost = await Host.delete(hostId);

      if (!deletedHost) {
        return res.status(404).json({ error: 'Host not found' });
      }

      res.json({ message: 'Host deleted successfully', data: deletedHost });
    } catch (error) {
      console.error('Detailed Error in employeeController.deleteHost:', error); // More detailed error logging
      // Check for PostgreSQL foreign key violation error code (23503)
      if (error.code === '23503') {
        return res.status(400).json({
          error: 'Cannot delete host: Host is currently assigned to one or more live accounts or schedules. Please remove all assignments and schedules first.'
        });
      }
      res.status(500).json({ error: 'Failed to delete host' });
    }
  },

  getByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const employee = await Employee.findByUserId(userId);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(employee);
    } catch (error) {
      console.error('Error in employeeController.getByUserId:', error);
      res.status(500).json({ error: 'Failed to fetch employee' });
    }
  },

  // Get or create employee by user ID
  getOrCreateByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Try to find existing employee
      let employee = await Employee.findByUserId(userId);
      
      // If employee doesn't exist, create a new one
      if (!employee) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        employee = await Employee.create({
          user_id: userId,
          name: user.username || 'New Employee',
          position: 'Staff',
          department: 'General'
        });
      }
      
      res.json(employee);
    } catch (error) {
      console.error('Error in employeeController.getOrCreateByUserId:', error);
      res.status(500).json({ error: 'Failed to get or create employee' });
    }
  },

  // Debug endpoint to check user ID
  checkUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Log user information for debugging
      console.log(`Checking user ID: ${userId}`);
      
      // Find all employees for debugging
      const allEmployees = await Employee.findAll();
      console.log('All employees:', allEmployees);
      
      // Try to find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          message: `No user found with ID: ${userId}`,
          allEmployees: allEmployees
        });
      }
      
      // Try to find employee
      const employee = await Employee.findByUserId(userId);
      
      res.json({
        userId: userId,
        userFound: !!user,
        userData: user,
        employeeFound: !!employee,
        employeeData: employee,
        allEmployees: allEmployees
      });
    } catch (error) {
      console.error('Error in employeeController.checkUserId:', error);
      res.status(500).json({ error: 'Failed to check user ID' });
    }
  },

  // Get all positions
  getPositions: async (req, res) => {
    try {
      console.log('Getting positions from database...');
      const positions = await Employee.getDistinctPositions();
      console.log('Found positions:', positions);
      res.json(positions);
    } catch (error) {
      console.error('Error in employeeController.getPositions:', error);
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  },

  // Get hosts (employees with position 'Host Live Streaming')
  getHosts: async (req, res) => {
    try {
      const hosts = await Host.findAll(); // Use the new findAll method from Host model
      res.json(hosts);
    } catch (error) {
      console.error('Error in employeeController.getHosts:', error);
      res.status(500).json({ error: 'Failed to fetch hosts' });
    }
  },

  // Get all host availability data
  getHostAvailability: async (req, res) => {
    try {
      const query = `
        SELECT
          ha.id,
          ha.host_id,
          ha.date,
          ha.is_available,
          e.name AS employee_name
        FROM host_availability ha
        JOIN hosts h ON ha.host_id = h.id
        JOIN employees e ON h.employee_id = e.id
        ORDER BY ha.date, e.name
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error in employeeController.getHostAvailability:', error);
      res.status(500).json({ error: 'Failed to fetch host availability data' });
    }
  },

  getHostAccountAssignments: async (req, res) => {
    try {
      const query = `
        SELECT
          haa.id,
          haa.host_id,
          haa.account_id,
          e.name AS employee_name,
          la.account_name
        FROM host_account_assignment haa
        JOIN hosts h ON haa.host_id = h.id
        JOIN employees e ON h.employee_id = e.id
        JOIN live_accounts la ON haa.account_id = la.id
        ORDER BY e.name, la.account_name
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Error in employeeController.getHostAccountAssignments:', error);
      res.status(500).json({ error: 'Failed to fetch host account assignments' });
    }
  },

  // Update host availability
  updateHostAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_available } = req.body;
      const result = await db.query(
        'UPDATE host_availability SET is_available = $1 WHERE id = $2 RETURNING *',
        [is_available, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Host availability not found' });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update host availability' });
    }
  },

  // Delete host availability
  deleteHostAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(
        'DELETE FROM host_availability WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Host availability not found' });
      }
      res.json({ success: true, message: 'Host availability deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete host availability' });
    }
  },
};

module.exports = employeeController; 