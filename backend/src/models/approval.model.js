const db = require('../config/database');

class Approval {
  static async findAll(params = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      requester_id,
      approver_id
    } = params;

    const offset = (page - 1) * limit;
    const values = [];
    const conditions = [];

    if (status) {
      conditions.push('a.status = $' + (values.length + 1));
      values.push(status);
    }

    if (type) {
      conditions.push('a.type = $' + (values.length + 1));
      values.push(type);
    }

    if (requester_id) {
      conditions.push('a.requester_id = $' + (values.length + 1));
      values.push(requester_id);
    }

    if (approver_id) {
      conditions.push('a.approver_id = $' + (values.length + 1));
      values.push(approver_id);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT 
        a.*,
        e1.name as requester_name,
        e2.name as approver_name
      FROM approvals a
      LEFT JOIN employees e1 ON a.requester_id = e1.id
      LEFT JOIN employees e2 ON a.approver_id = e2.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM approvals a
      ${whereClause}
    `;

    values.push(limit, offset);

    try {
      const [results, countResult] = await Promise.all([
        db.query(query, values),
        db.query(countQuery, values.slice(0, -2))
      ]);

      return {
        data: results.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT 
        a.*,
        e1.name as requester_name,
        e2.name as approver_name
      FROM approvals a
      LEFT JOIN employees e1 ON a.requester_id = e1.id
      LEFT JOIN employees e2 ON a.approver_id = e2.id
      WHERE a.id = $1
    `;

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async create(approvalData) {
    const { type, requester_id, details } = approvalData;
    const query = `
      INSERT INTO approvals (type, requester_id, details)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [type, requester_id, details]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status, approver_id) {
    const query = `
      UPDATE approvals
      SET status = $1, approver_id = $2
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [status, approver_id, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM approvals WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Approval; 