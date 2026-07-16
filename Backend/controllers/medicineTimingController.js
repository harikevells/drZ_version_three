const MedicineTiming = require('../models/MedicineTiming');

const createTiming = async (req, res) => {
    try {
        const data = req.body;
        const newTiming = await MedicineTiming.create(data);
        res.status(201).json(newTiming);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getAllTimings = async (req, res) => {
    try {
        const timings = await MedicineTiming.find({});
        res.status(200).json(timings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateTiming = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const updated = await MedicineTiming.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ error: 'Timing not found' });
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteTiming = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await MedicineTiming.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Timing not found' });
        res.status(200).json({ message: 'Timing deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createTiming, getAllTimings, updateTiming, deleteTiming };
