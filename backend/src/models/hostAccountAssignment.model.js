const db = require('../config/database');

class HostAccountAssignment {
  static async create(assignmentData) {
    try {
      const { host_id, account_id } = assignmentData;
      const query = 'INSERT INTO host_account_assignment (host_id, account_id) VALUES ($1, $2) RETURNING *';
      const values = [host_id, account_id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in HostAccountAssignment.create:', error);
      throw error;
    }
  }

  // You can add other methods here like findById, findAll, update, delete
  // For example, to get all assignments with host and account names:
  static async findAllWithDetails() {
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
      return result.rows;
    } catch (error) {
      console.error('Error in HostAccountAssignment.findAllWithDetails:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM host_account_assignment WHERE id = $1 RETURNING *';
      const values = [id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in HostAccountAssignment.delete:', error);
      throw error;
    }
  }

  static async update(id, assignmentData) {
    try {
      const { host_id, account_id } = assignmentData;
      const query = 'UPDATE host_account_assignment SET host_id = $1, account_id = $2 WHERE id = $3 RETURNING *';
      const values = [host_id, account_id, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in HostAccountAssignment.update:', error);
      throw error;
    }
  }
}

module.exports = HostAccountAssignment; 