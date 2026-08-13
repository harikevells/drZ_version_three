const Room = require('../models/Room');

exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({});
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const roomData = req.body;
        // Default status and patients array
        roomData.status = roomData.status || 'Available';
        roomData.patients = []; 
        roomData.createdAt = new Date().toISOString();
        
        const newRoom = await Room.create(roomData);
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const updatedRoom = await Room.findByIdAndUpdate(id, updateData);
        if (!updatedRoom) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedRoom = await Room.findByIdAndDelete(id);
        if (!deletedRoom) {
            return res.status(404).json({ error: 'Room not found' });
        }
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.admitPatient = async (req, res) => {
    try {
        const { id } = req.params;
        const patientData = req.body; // { name, id, date, time, profileImage }
        
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        const currentPatients = room.patients || [];
        const capacity = parseInt(room.capacity) || 1;
        
        if (currentPatients.length >= capacity) {
            return res.status(400).json({ error: 'Room is already at full capacity' });
        }
        
        // Ensure patient has a unique ID, fallback to provided id or timestamp
        const patientEntry = {
            ...patientData,
            _admissionId: Date.now().toString() // unique identifier for this specific admission
        };
        
        const updatedPatients = [...currentPatients, patientEntry];
        const newStatus = updatedPatients.length >= capacity ? 'Occupied' : 'Available';
        
        const updateData = {
            status: newStatus,
            patients: updatedPatients
        };
        
        await Room.findByIdAndUpdate(id, updateData);
        res.status(200).json({ message: 'Patient admitted successfully', ...updateData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.dischargePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const dischargeData = req.body; // { dischargeDate, dischargeTime, patientId, _admissionId }
        
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        
        const currentPatients = room.patients || [];
        
        // Remove the specific patient
        const updatedPatients = currentPatients.filter(p => p._admissionId !== dischargeData._admissionId);
        
        // Since there are multiple beds, if we discharge someone, it is not "Cleaning" for the whole room if others are there.
        // It just becomes Available (or stays Available if it already was).
        const updateData = {
            status: 'Available',
            patients: updatedPatients
        };
        
        await Room.findByIdAndUpdate(id, updateData);
        res.status(200).json({ message: 'Patient discharged successfully', ...updateData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
