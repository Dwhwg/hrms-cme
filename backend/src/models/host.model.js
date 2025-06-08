const db = require('../config/database');

class Host {
  static async findByEmployeeId(employeeId) {
    try {
      const query = 'SELECT * FROM hosts WHERE employee_id = $1';
      const result = await db.query(query, [employeeId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Host.findByEmployeeId:', error);
      throw error;
    }
  }

  static async create(hostData) {
    try {
      const { employee_id, is_active = true } = hostData;
      const query = 'INSERT INTO hosts (employee_id, is_active) VALUES ($1, $2) RETURNING *';
      const values = [employee_id, is_active];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Host.create:', error);
      throw error;
    }
  }

  static async update(id, hostData) {
    try {
      // Build update query dynamically based on hostData
      const fields = Object.keys(hostData);
      const setClauses = fields.map((field, index) => `"${field}" = $${index + 1}`).join(', ');
      const values = Object.values(hostData);

      if (fields.length === 0) {
        return null; // No fields to update
      }

      const query = `UPDATE hosts SET ${setClauses} WHERE id = $${fields.length + 1} RETURNING *`;
      const result = await db.query(query, [...values, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Host.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM hosts WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in Host.delete:', error);
      throw error;
    }
  }

  // Add other host-related methods here if needed (e.g., getAll, findById, delete)
  static async findAll() {
    try {
      // This query joins hosts with employees to get employee_name
      const query = `
        SELECT
          h.id,
          h.employee_id,
          h.is_active,
          e.name AS employee_name
        FROM
          hosts h
        JOIN
          employees e ON h.employee_id = e.id
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in Host.findAll:', error);
      throw error;
    }
  }
}

module.exports = Host; 