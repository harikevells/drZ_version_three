const express = require('express');
const router = express.Router();
const { createBilling, getAllBillings, getBillingById } = require('../controllers/billingController');

router.post('/', createBilling);
router.get('/', getAllBillings);
router.get('/:id', getBillingById);

module.exports = router;
