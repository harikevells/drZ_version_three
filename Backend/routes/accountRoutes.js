const express = require('express');
const router = express.Router();
const { getAccounts, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');
const protect = require('../middleware/authMiddleware');

router.get('/', protect, getAccounts);
router.post('/', protect, createAccount);
router.put('/:id', protect, updateAccount);
router.delete('/:id', protect, deleteAccount);

module.exports = router;
