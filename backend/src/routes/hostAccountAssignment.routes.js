const express = require('express');
const router = express.Router();
const hostAccountAssignmentController = require('../controllers/hostAccountAssignment.controller');

router.post('/', hostAccountAssignmentController.create);
router.get('/', hostAccountAssignmentController.getAll);
router.delete('/:id', hostAccountAssignmentController.deleteAssignment);
router.put('/:id', hostAccountAssignmentController.updateAssignment);

module.exports = router; 