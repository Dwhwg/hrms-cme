const express = require('express');
const router = express.Router();
const officeLocationController = require('../controllers/officeLocation.controller');
const { auth, isPIC } = require('../middleware/auth.middleware');

// Routes
router.post('/', auth, isPIC, officeLocationController.create);
router.get('/', auth, isPIC, officeLocationController.getAll);
router.get('/:id', auth, isPIC, officeLocationController.getById);
router.put('/:id', auth, isPIC, officeLocationController.update);
router.delete('/:id', auth, isPIC, officeLocationController.delete);

module.exports = router; 