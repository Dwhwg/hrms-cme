const express = require('express');
const router = express.Router();
const ApprovalController = require('../controllers/approval.controller');
const { auth, isPIC } = require('../middleware/auth.middleware');

// Get all approvals
router.get('/', auth, ApprovalController.getAllApprovals);

// Get approval by ID
router.get('/:id', auth, ApprovalController.getApprovalById);

// Create new approval
router.post('/', auth, ApprovalController.createApproval);

// Approve approval
router.put('/:id/approve', auth, isPIC, ApprovalController.approveApproval);

// Reject approval
router.put('/:id/reject', auth, isPIC, ApprovalController.rejectApproval);

// Delete approval
router.delete('/:id', auth, isPIC, ApprovalController.deleteApproval);

module.exports = router; 