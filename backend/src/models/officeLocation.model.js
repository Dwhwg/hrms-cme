const db = require('../config/database');

class OfficeLocation {
  static async create(locationData) {
    try {
      const { name, address, latitude, longitude, radius } = locationData;
      const query = `
        INSERT INTO office_locations (name, address, latitude, longitude, radius)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const values = [name, address, latitude, longitude, radius];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in OfficeLocation.create:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const query = 'SELECT * FROM office_locations';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error in OfficeLocation.findAll:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const query = 'SELECT * FROM office_locations WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in OfficeLocation.findById:', error);
      throw error;
    }
  }

  static async update(id, locationData) {
    try {
      const { name, address, latitude, longitude, radius } = locationData;
      const query = `
        UPDATE office_locations
        SET name = $1, address = $2, latitude = $3, longitude = $4, radius = $5
        WHERE id = $6
        RETURNING *
      `;
      const values = [name, address, latitude, longitude, radius, id];
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error in OfficeLocation.update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const query = 'DELETE FROM office_locations WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error in OfficeLocation.delete:', error);
      throw error;
    }
  }
}

module.exports = OfficeLocation; 