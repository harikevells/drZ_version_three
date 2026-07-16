const MedicineIntake = require('../models/MedicineIntake');

const createIntake = async (req, res) => {
    try {
        const data = req.body;
        const newIntake = await MedicineIntake.create(data);
        res.status(201).json(newIntake);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllIntakes = async (req, res) => {
    try {
        const intakes = await MedicineIntake.find({});
        res.status(200).json(intakes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateIntake = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await MedicineIntake.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: 'Intake not found' });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteIntake = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MedicineIntake.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Intake not found' });
        res.status(200).json({ message: 'Intake deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createIntake, getAllIntakes, updateIntake, deleteIntake };
