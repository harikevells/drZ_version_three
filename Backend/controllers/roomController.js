const Room = require('../models/Room');

exports.getAllRooms = async (req, res) => {
    try {
        const snapshot = await Room.get();
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const roomData = req.body;
        // Default status and patient if not provided
        roomData.status = roomData.status || 'Available';
        roomData.patient = roomData.patient || null;
        roomData.createdAt = new Date().toISOString();
        
        const docRef = await Room.add(roomData);
        res.status(201).json({ id: docRef.id, ...roomData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        await Room.doc(id).update(updateData);
        res.status(200).json({ message: 'Room updated successfully', id, ...updateData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        await Room.doc(id).delete();
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.admitPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientData = req.body; // { name, id, date, time }
        
        const updateData = {
            status: 'Occupied',
            patient: patientData
        };
        
        await Room.doc(id).update(updateData);
        res.status(200).json({ message: 'Patient admitted successfully', ...updateData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.dischargePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const dischargeData = req.body; // { dischargeDate, dischargeTime, patientName, patientId }
        
        const updateData = {
            status: 'Cleaning',
            patient: null
        };
        
        await Room.doc(id).update(updateData);
        res.status(200).json({ message: 'Patient discharged successfully', ...updateData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
