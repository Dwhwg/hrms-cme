const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const { auth, isPIC } = require('../middleware/auth.middleware');

// Debug route
router.get('/debug/check-user/:userId', auth, employeeController.checkUserId);

// Get positions list (must be before /:id route)
router.get('/positions', auth, employeeController.getPositions);

// Routes
router.post('/', auth, isPIC, employeeController.create);
router.get('/', auth, isPIC, employeeController.getAll);
router.get('/hosts', auth, employeeController.getHosts);
router.get('/host-availability', auth, employeeController.getHostAvailability);
router.get('/host-account-assignments', auth, employeeController.getHostAccountAssignments);
router.get('/user/:userId', auth, employeeController.getByUserId);
router.get('/user/:userId/getOrCreate', auth, employeeController.getOrCreateByUserId);
router.get('/:id', auth, isPIC, employeeController.getById);
router.put('/:id', auth, isPIC, employeeController.update);
router.delete('/:id', auth, isPIC, employeeController.delete);
router.delete('/hosts/:id', auth, isPIC, employeeController.deleteHost);
router.patch('/host-availability/:id', auth, isPIC, employeeController.updateHostAvailability);
router.delete('/host-availability/:id', auth, isPIC, employeeController.deleteHostAvailability);

module.exports = router; 