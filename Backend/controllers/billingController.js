const Billing = require('../models/Billing');

const createBilling = async (req, res) => {
    try {
        const data = req.body;
        const newBill = await Billing.create(data);
        res.status(201).json(newBill);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllBillings = async (req, res) => {
    try {
        const bills = await Billing.find({});
        res.status(200).json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getBillingById = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await Billing.findById(id);
        if (!bill) return res.status(404).json({ error: 'Billing record not found' });
        res.status(200).json(bill);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createBilling, getAllBillings, getBillingById };
