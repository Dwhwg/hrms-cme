const Approval = require('../models/approval.model');

class ApprovalController {
  static async getAllApprovals(req, res) {
    try {
      const { page, limit, status, type } = req.query;
      const approvals = await Approval.findAll({
        page,
        limit,
        status,
        type
      });
      res.json(approvals);
    } catch (error) {
      console.error('Error in getAllApprovals:', error);
      res.status(500).json({ error: 'Failed to fetch approvals' });
    }
  }

  static async getApprovalById(req, res) {
    try {
      const { id } = req.params;
      const approval = await Approval.findById(id);
      
      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }
      
      res.json(approval);
    } catch (error) {
      console.error('Error in getApprovalById:', error);
      res.status(500).json({ error: 'Failed to fetch approval' });
    }
  }

  static async createApproval(req, res) {
    try {
      const { type, details } = req.body;
      const requester_id = req.user.id;

      const approval = await Approval.create({
        type,
        requester_id,
        details
      });

      res.status(201).json(approval);
    } catch (error) {
      console.error('Error in createApproval:', error);
      res.status(500).json({ error: 'Failed to create approval' });
    }
  }

  static async approveApproval(req, res) {
    try {
      const { id } = req.params;
      const approver_id = req.user.id;

      const approval = await Approval.updateStatus(id, 'approved', approver_id);
      
      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      res.json(approval);
    } catch (error) {
      console.error('Error in approveApproval:', error);
      res.status(500).json({ error: 'Failed to approve approval' });
    }
  }

  static async rejectApproval(req, res) {
    try {
      const { id } = req.params;
      const approver_id = req.user.id;

      const approval = await Approval.updateStatus(id, 'rejected', approver_id);
      
      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      res.json(approval);
    } catch (error) {
      console.error('Error in rejectApproval:', error);
      res.status(500).json({ error: 'Failed to reject approval' });
    }
  }

  static async deleteApproval(req, res) {
    try {
      const { id } = req.params;
      const approval = await Approval.delete(id);
      
      if (!approval) {
        return res.status(404).json({ error: 'Approval not found' });
      }

      res.json({ message: 'Approval deleted successfully' });
    } catch (error) {
      console.error('Error in deleteApproval:', error);
      res.status(500).json({ error: 'Failed to delete approval' });
    }
  }
}

module.exports = ApprovalController; 