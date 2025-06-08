const HostAccountAssignment = require('../models/hostAccountAssignment.model');

const hostAccountAssignmentController = {
  create: async (req, res) => {
    try {
      const { host_id, account_id } = req.body;

      if (!host_id || !account_id) {
        return res.status(400).json({ error: 'Host ID and Account ID are required' });
      }

      const newAssignment = await HostAccountAssignment.create({ host_id, account_id });
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error('Error in hostAccountAssignmentController.create:', error);
      res.status(500).json({ error: 'Failed to create host account assignment' });
    }
  },

  getAll: async (req, res) => {
    try {
      const assignments = await HostAccountAssignment.findAllWithDetails();
      res.json(assignments);
    } catch (error) {
      console.error('Error in hostAccountAssignmentController.getAll:', error);
      res.status(500).json({ error: 'Failed to fetch host account assignments' });
    }
  },

  deleteAssignment: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Assignment ID is required' });
      }

      const deletedAssignment = await HostAccountAssignment.delete(id);

      if (!deletedAssignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      res.status(200).json({ message: 'Assignment deleted successfully', data: deletedAssignment });
    } catch (error) {
      console.error('Error in hostAccountAssignmentController.deleteAssignment:', error);
      res.status(500).json({ error: 'Failed to delete host account assignment' });
    }
  },

  updateAssignment: async (req, res) => {
    try {
      const { id } = req.params;
      const { host_id, account_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Assignment ID is required' });
      }
      if (!host_id || !account_id) {
        return res.status(400).json({ error: 'Host ID and Account ID are required' });
      }

      const updatedAssignment = await HostAccountAssignment.update(id, { host_id, account_id });

      if (!updatedAssignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      res.status(200).json({ message: 'Assignment updated successfully', data: updatedAssignment });
    } catch (error) {
      console.error('Error in hostAccountAssignmentController.updateAssignment:', error);
      res.status(500).json({ error: 'Failed to update host account assignment' });
    }
  },

  // You can add update and delete methods here as needed
};

module.exports = hostAccountAssignmentController; 