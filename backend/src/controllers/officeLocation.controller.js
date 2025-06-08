const OfficeLocation = require('../models/officeLocation.model');

const officeLocationController = {
  // Create new office location
  create: async (req, res) => {
    try {
      const { name, address, latitude, longitude, radius } = req.body;
      
      // Validate required fields
      if (!name || !address || !latitude || !longitude || !radius) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate latitude and longitude
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
      }

      // Validate radius
      if (isNaN(radius) || radius <= 0) {
        return res.status(400).json({ error: 'Radius must be a positive number' });
      }

      const location = await OfficeLocation.create({
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      });
      
      res.status(201).json(location);
    } catch (error) {
      console.error('Error in officeLocationController.create:', error);
      res.status(500).json({ error: 'Failed to create office location' });
    }
  },

  // Get all office locations
  getAll: async (req, res) => {
    try {
      const locations = await OfficeLocation.findAll();
      res.json(locations);
    } catch (error) {
      console.error('Error in officeLocationController.getAll:', error);
      res.status(500).json({ error: 'Failed to fetch office locations' });
    }
  },

  // Get office location by ID
  getById: async (req, res) => {
    try {
      const location = await OfficeLocation.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ error: 'Office location not found' });
      }
      res.json(location);
    } catch (error) {
      console.error('Error in officeLocationController.getById:', error);
      res.status(500).json({ error: 'Failed to fetch office location' });
    }
  },

  // Update office location
  update: async (req, res) => {
    try {
      const { name, address, latitude, longitude, radius } = req.body;
      
      // Validate required fields
      if (!name || !address || !latitude || !longitude || !radius) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate latitude and longitude
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: 'Latitude and longitude must be numbers' });
      }

      // Validate radius
      if (isNaN(radius) || radius <= 0) {
        return res.status(400).json({ error: 'Radius must be a positive number' });
      }

      const location = await OfficeLocation.update(req.params.id, {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      });
      
      if (!location) {
        return res.status(404).json({ error: 'Office location not found' });
      }
      
      res.json(location);
    } catch (error) {
      console.error('Error in officeLocationController.update:', error);
      res.status(500).json({ error: 'Failed to update office location' });
    }
  },

  // Delete office location
  delete: async (req, res) => {
    try {
      const location = await OfficeLocation.delete(req.params.id);
      if (!location) {
        return res.status(404).json({ error: 'Office location not found' });
      }
      res.json({ message: 'Office location deleted successfully' });
    } catch (error) {
      console.error('Error in officeLocationController.delete:', error);
      res.status(500).json({ error: 'Failed to delete office location' });
    }
  }
};

module.exports = officeLocationController; 