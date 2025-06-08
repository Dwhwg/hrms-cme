const express = require('express');
const router = express.Router();
const liveAccountController = require('../controllers/liveAccountController');

// Create new live account
router.post('/', liveAccountController.createAccount);

// Get all live accounts
router.get('/', liveAccountController.getAllAccounts);

// Get live account by ID
router.get('/:id', liveAccountController.getAccountById);

// Update live account
router.put('/:id', liveAccountController.updateAccount);

// Delete live account
router.delete('/:id', liveAccountController.deleteAccount);

module.exports = router; 