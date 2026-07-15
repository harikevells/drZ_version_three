const Medicine = require('../models/Medicine');

const createMedicine = async (req, res) => {
    try {
        const data = req.body;
        const newMedicine = await Medicine.create(data);
        res.status(201).json(newMedicine);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find({});
        res.status(200).json(medicines);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await Medicine.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: 'Medicine not found' });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Medicine.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Medicine not found' });
        res.status(200).json({ message: 'Medicine deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createMedicine, getAllMedicines, updateMedicine, deleteMedicine };
