const db = require('../config/database');

class Employee {
  static async create(employeeData) {
    try {
      const { user_id, name, position, department, supervisor_id } = employeeData;
      const query = `
        INSERT INTO employees (user_id, name, position, department, supervisor_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [user_id, name, position, department, supervisor_id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Employee.create:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const query = `
        SELECT e.*, u.username, u.role 
        FROM employees e
        JOIN users u ON e.user_id = u.id
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in Employee.findAll:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = `
        SELECT e.*, u.username, u.role 
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Employee.findById:', error);
      throw error;
    }
  }

  static async update(id, employeeData) {
    try {
      const { name, position, department, supervisor_id } = employeeData;
      const query = `
        UPDATE employees
        SET name = $1, position = $2, department = $3, supervisor_id = $4
        WHERE id = $5
        RETURNING *
      `;
      const values = [name, position, department, supervisor_id, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Employee.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM employees WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Employee.delete:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    try {
      const query = `
        SELECT e.*, u.username, u.role 
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE e.user_id = $1
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Employee.findByUserId:', error);
      throw error;
    }
  }

  static async getDistinctPositions() {
    try {
      console.log('Executing getDistinctPositions query...');
      const query = `
        SELECT DISTINCT position 
        FROM employees 
        WHERE position IS NOT NULL 
        ORDER BY position ASC
      `;
      console.log('Query:', query);
      const result = await db.query(query);
      console.log('Query result:', result.rows);
      return result.rows.map(row => row.position);
    } catch (error) {
      console.error('Error in Employee.getDistinctPositions:', error);
      throw error;
    }
  }
}

module.exports = Employee; 