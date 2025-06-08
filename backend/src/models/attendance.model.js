const db = require('../config/database');

class Attendance {
  static async create(employeeId, type, latitude, longitude, photoUrl, locationMethod, wifiInfo) {
    try {
      const query = `
        INSERT INTO attendances (
          employee_id, 
          type, 
          latitude, 
          longitude, 
          photo_url, 
          location_method,
          wifi_info,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      const result = await db.query(query, [
        employeeId, 
        type, 
        latitude, 
        longitude, 
        photoUrl,
        locationMethod,
        wifiInfo
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  }

  static async findByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT a.*, e.name as employee_name
        FROM attendances a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = $1
        ORDER BY a.created_at DESC
      `;
      const result = await db.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding attendances:', error);
      throw error;
    }
  }

  static async findByEmployeeIdAndMonth(employeeId, month, year) {
    try {
      // 确保月份是两位数格式
      const formattedMonth = month.toString().padStart(2, '0');
      
      const query = `
        SELECT a.*, e.name as employee_name
        FROM attendances a
        JOIN employees e ON a.employee_id = e.id
        WHERE a.employee_id = $1
        AND EXTRACT(MONTH FROM a.created_at) = $2
        AND EXTRACT(YEAR FROM a.created_at) = $3
        ORDER BY a.created_at DESC
      `;
      const result = await db.query(query, [employeeId, month, year]);
      return result.rows;
    } catch (error) {
      console.error('Error finding attendances by month:', error);
      throw error;
    }
  }

  static async findByDepartmentWithFilters(filters) {
    try {
      let query = `
        SELECT 
          a.*,
          e.name as employee_name,
          e.department as department_name
        FROM attendances a
        JOIN employees e ON a.employee_id = e.id
        WHERE 1=1
      `;
      const values = [];
      let valueIndex = 1;

      if (filters.employeeId) {
        query += ` AND a.employee_id = $${valueIndex}`;
        values.push(filters.employeeId);
        valueIndex++;
      }

      if (filters.department) {
        query += ` AND e.department = $${valueIndex}`;
        values.push(filters.department);
        valueIndex++;
      }

      if (filters.month) {
        query += ` AND EXTRACT(MONTH FROM a.created_at) = $${valueIndex}`;
        values.push(filters.month);
        valueIndex++;
      }

      if (filters.year) {
        query += ` AND EXTRACT(YEAR FROM a.created_at) = $${valueIndex}`;
        values.push(filters.year);
        valueIndex++;
      }

      if (filters.type) {
        query += ` AND a.type = $${valueIndex}`;
        values.push(filters.type);
        valueIndex++;
      }

      query += ` ORDER BY a.created_at DESC`;

      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error finding attendances with filters:', error);
      throw error;
    }
  }

  static async findTodayByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT * FROM attendances
        WHERE employee_id = $1
        AND DATE(created_at) = CURRENT_DATE
        ORDER BY created_at DESC
      `;
      const result = await db.query(query, [employeeId]);
      return result.rows;
    } catch (error) {
      console.error('Error finding today\'s attendance:', error);
      throw error;
    }
  }

  static async findLastByEmployeeId(employeeId) {
    try {
      const query = `
        SELECT * FROM attendances
        WHERE employee_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const result = await db.query(query, [employeeId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding last attendance:', error);
      throw error;
    }
  }
}

module.exports = Attendance; 