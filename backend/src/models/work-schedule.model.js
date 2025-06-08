const db = require('../config/database');

class WorkSchedule {
  static async create(scheduleData) {
    try {
      const { 
        position, 
        employee_id, 
        date,
        start_time, 
        end_time, 
        schedule_type,
        notes,
        created_by
      } = scheduleData;
      
      const query = `
        INSERT INTO work_schedules (
          position, employee_id, date, 
          start_time, end_time, 
          schedule_type, notes,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        position, employee_id, date, 
        start_time, end_time, 
        schedule_type, notes,
        created_by
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in WorkSchedule.create:', error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT ws.*, 
               e.name as employee_name, 
               e.position as employee_position
        FROM work_schedules ws
        LEFT JOIN employees e ON ws.employee_id = e.id
        WHERE 1=1
      `;
      
      const values = [];
      let paramIndex = 1;
      
      if (filters.position && filters.position !== 'all') {
        query += ` AND ws.position = $${paramIndex}`;
        values.push(filters.position);
        paramIndex++;
      }
      
      if (filters.employee_id) {
        query += ` AND ws.employee_id = $${paramIndex}`;
        values.push(filters.employee_id);
        paramIndex++;
      }
      
      if (filters.start_date) {
        query += ` AND ws.date >= $${paramIndex}`;
        values.push(filters.start_date);
        paramIndex++;
      }
      
      if (filters.end_date) {
        query += ` AND ws.date <= $${paramIndex}`;
        values.push(filters.end_date);
        paramIndex++;
      }
      
      if (filters.status === 'on') {
        query += ` AND ws.schedule_type IN ('Work', 'Training')`;
      } else if (filters.status === 'off') {
        query += ` AND ws.schedule_type = 'Off Day'`;
      } else if (filters.schedule_type) {
        query += ` AND ws.schedule_type = $${paramIndex}`;
        values.push(filters.schedule_type);
        paramIndex++;
      }
      
      query += ` ORDER BY ws.date DESC, ws.start_time ASC`;
      
      if (filters.limit && filters.offset !== undefined) {
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        values.push(filters.limit, filters.offset);
      }
      
      const result = await db.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error in WorkSchedule.findAll:', error);
      throw error;
    }
  }

  static async countAll(filters = {}) {
    try {
      let query = `
        SELECT COUNT(*) as total
        FROM work_schedules ws
        WHERE 1=1
      `;
      
      const values = [];
      let paramIndex = 1;
      
      if (filters.position && filters.position !== 'all') {
        query += ` AND ws.position = $${paramIndex}`;
        values.push(filters.position);
        paramIndex++;
      }
      
      if (filters.employee_id) {
        query += ` AND ws.employee_id = $${paramIndex}`;
        values.push(filters.employee_id);
        paramIndex++;
      }
      
      if (filters.start_date) {
        query += ` AND ws.date >= $${paramIndex}`;
        values.push(filters.start_date);
        paramIndex++;
      }
      
      if (filters.end_date) {
        query += ` AND ws.date <= $${paramIndex}`;
        values.push(filters.end_date);
        paramIndex++;
      }
      
      if (filters.status === 'on') {
        query += ` AND ws.schedule_type IN ('Work', 'Training')`;
      } else if (filters.status === 'off') {
        query += ` AND ws.schedule_type = 'Off Day'`;
      } else if (filters.schedule_type) {
        query += ` AND ws.schedule_type = $${paramIndex}`;
        values.push(filters.schedule_type);
        paramIndex++;
      }
      
      const result = await db.query(query, values);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Error in WorkSchedule.countAll:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT ws.*, 
               e.name as employee_name, 
               e.position as employee_position
        FROM work_schedules ws
        LEFT JOIN employees e ON ws.employee_id = e.id
        WHERE ws.id = $1
      `;
      
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in WorkSchedule.findById:', error);
      throw error;
    }
  }

  static async update(id, scheduleData) {
    try {
      const { 
        position, 
        employee_id, 
        date,
        start_time, 
        end_time, 
        schedule_type,
        notes,
      } = scheduleData;
      
      const query = `
        UPDATE work_schedules
        SET position = $1,
            employee_id = $2,
            date = $3,
            start_time = $4,
            end_time = $5,
            schedule_type = $6,
            notes = $7,
            updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      
      const values = [
        position, employee_id, date, 
        start_time, end_time, schedule_type, notes, id
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in WorkSchedule.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM work_schedules WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in WorkSchedule.delete:', error);
      throw error;
    }
  }

  static async autoGenerate(startDate, endDate, createdBy) {
    console.log(`Auto-generating schedules from ${startDate} to ${endDate} by user ${createdBy}`);
    throw new Error('Auto-generate functionality is not yet fully implemented.');
  }
}

module.exports = WorkSchedule; 