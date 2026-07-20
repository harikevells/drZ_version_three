const MedicineDay = require('../models/MedicineDay');

const createDay = async (req, res) => {
    try {
        const data = req.body;
        const newDay = await MedicineDay.create(data);
        res.status(201).json(newDay);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllDays = async (req, res) => {
    try {
        const days = await MedicineDay.find({});
        res.status(200).json(days);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateDay = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await MedicineDay.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: 'Day not found' });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteDay = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MedicineDay.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Day not found' });
        res.status(200).json({ message: 'Day deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createDay, getAllDays, updateDay, deleteDay };
