import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaEdit, FaSave, FaUserInjured, FaPrescriptionBottleAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config';
import './DoctorPrescriptions.css';

const DoctorPrescriptions = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  
  // Form State
  const [medicines, setMedicines] = useState([]);
  const [medicineOptions, setMedicineOptions] = useState([]);
  const [timingOptions, setTimingOptions] = useState([]);
  const [intakeOptions, setIntakeOptions] = useState([]);
  
  // Current Medicine Input State
  const [medName, setMedName] = useState('');
  const [timing, setTiming] = useState('');
  const [intake, setIntake] = useState('');
  const [days, setDays] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const storedData = sessionStorage.getItem('doctorData');
      if (storedData) {
        const user = JSON.parse(storedData);
        
        // Fetch appointments
        const apptsRes = await axios.get(`${API_BASE_URL}/appointments/all/${encodeURIComponent(user.doctorName)}`);
        // Filter for only Completed or Approved that need prescriptions
        const eligibleAppts = apptsRes.data.filter(app => 
          ['approved', 'completed'].includes(app.status?.toLowerCase())
        );
        setAppointments(eligibleAppts);
      }

      // Fetch dynamic options
      const [medRes, timeRes, intakeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/medicines`),
        axios.get(`${API_BASE_URL}/medicine-timings`),
        axios.get(`${API_BASE_URL}/medicine-intakes`),
      ]);
      
      setMedicineOptions(medRes.data.filter(m => m.activeStatus !== false));
      setTimingOptions(timeRes.data.filter(t => t.status !== 'Inactive'));
      setIntakeOptions(intakeRes.data.filter(i => i.status !== 'Inactive'));
      
    } catch (error) {
      console.error("Error loading prescription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    if (appt.prescription && Array.isArray(appt.prescription)) {
      setMedicines(appt.prescription);
    } else {
      setMedicines([]);
    }
    resetForm();
  };

  const resetForm = () => {
    setMedName('');
    setTiming('');
    setIntake('');
    setDays('');
    setEditingId(null);
  };

  const handleAddMedicine = () => {
    if (!medName) {
      alert("Please enter or select a medicine name.");
      return;
    }

    if (editingId) {
      setMedicines(medicines.map(m => m.id === editingId ? {
        id: m.id,
        name: medName,
        timing,
        intake,
        days
      } : m));
    } else {
      setMedicines([...medicines, {
        id: Date.now().toString(),
        name: medName,
        timing,
        intake,
        days
      }]);
    }
    resetForm();
  };

  const handleEdit = (med) => {
    setMedName(med.name);
    setTiming(med.timing);
    setIntake(med.intake);
    setDays(med.days);
    setEditingId(med.id);
  };

  const handleDelete = (id) => {
    if(window.confirm("Remove this medicine?")) {
      setMedicines(medicines.filter(m => m.id !== id));
      if (editingId === id) resetForm();
    }
  };

  const handleSubmit = async () => {
    if (medicines.length === 0) {
      if(!window.confirm("Are you sure you want to save an empty prescription?")) return;
    }
    
    setSubmitting(true);
    try {
      const id = selectedAppt.id || selectedAppt._id;
      await axios.put(`${API_BASE_URL}/appointments/${id}/prescription`, {
        prescription: medicines
      });
      alert("Prescription saved successfully!");
      // Optionally re-fetch
      fetchInitialData();
      setSelectedAppt(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="doc-rx-container">
        
        {/* Left Side: Appointment List */}
        <div className="doc-rx-list-panel">
          <div className="doc-rx-panel-header">
            <h3>Select Patient</h3>
          </div>
          
          <div className="doc-rx-appt-list">
            {loading ? (
              <div className="doc-rx-empty">Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="doc-rx-empty">No eligible appointments found.</div>
            ) : (
              appointments.map(appt => (
                <div 
                  key={appt.id || appt._id} 
                  className={`doc-rx-appt-card ${selectedAppt && (selectedAppt.id === appt.id || selectedAppt._id === appt._id) ? 'active' : ''}`}
                  onClick={() => handleSelectAppointment(appt)}
                >
                  <div className="doc-rx-appt-avatar">
                    <FaUserInjured size={20} color={selectedAppt && (selectedAppt.id === appt.id || selectedAppt._id === appt._id) ? '#fff' : '#6B7AFF'} />
                  </div>
                  <div className="doc-rx-appt-info">
                    <h4>{appt.patient_name}</h4>
                    <p>{appt.appointment_date} • {appt.appointment_time}</p>
                  </div>
                  {appt.prescription?.length > 0 && (
                    <div className="doc-rx-badge-saved">
                      <FaPrescriptionBottleAlt size={12} /> Saved
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Prescription Builder */}
        <div className="doc-rx-builder-panel">
          {!selectedAppt ? (
            <div className="doc-rx-builder-empty">
              <FaPrescriptionBottleAlt size={64} color="#E2E8F0" />
              <h3>Select a patient to write a prescription</h3>
            </div>
          ) : (
            <>
              <div className="doc-rx-builder-header">
                <div>
                  <h3>Prescription for {selectedAppt.patient_name}</h3>
                  <p>Booking ID: {selectedAppt.booking_id || 'N/A'}</p>
                </div>
                <button 
                  className="doc-rx-save-btn" 
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  <FaSave /> {submitting ? 'Saving...' : 'Save Prescription'}
                </button>
              </div>

              {/* Medicine Input Form */}
              <div className="doc-rx-form-grid">
                <div className="doc-rx-form-group">
                  <label>Medicine Name</label>
                  <input 
                    type="text" 
                    list="medicine-list"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="Enter or select medicine"
                  />
                  <datalist id="medicine-list">
                    {medicineOptions.map((m, i) => <option key={i} value={m.medicineName || m.brandName} />)}
                  </datalist>
                </div>

                <div className="doc-rx-form-group">
                  <label>Timing</label>
                  <input 
                    type="text" 
                    list="timing-list"
                    value={timing}
                    onChange={(e) => setTiming(e.target.value)}
                    placeholder="e.g. Morning, Night"
                  />
                  <datalist id="timing-list">
                    {timingOptions.map((t, i) => <option key={i} value={t.title} />)}
                  </datalist>
                </div>

                <div className="doc-rx-form-group">
                  <label>Intake</label>
                  <input 
                    type="text" 
                    list="intake-list"
                    value={intake}
                    onChange={(e) => setIntake(e.target.value)}
                    placeholder="e.g. After Food"
                  />
                  <datalist id="intake-list">
                    {intakeOptions.map((intk, i) => <option key={i} value={intk.intake || intk.title} />)}
                  </datalist>
                </div>

                <div className="doc-rx-form-group">
                  <label>Duration (Days)</label>
                  <input 
                    type="text" 
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="e.g. 5 Days"
                  />
                </div>

                <div className="doc-rx-form-action">
                  <button className="doc-rx-add-btn" onClick={handleAddMedicine}>
                    <FaPlus /> {editingId ? 'Update' : 'Add'}
                  </button>
                  {editingId && (
                    <button className="doc-rx-cancel-btn" onClick={resetForm}>Cancel</button>
                  )}
                </div>
              </div>

              {/* Added Medicines List */}
              <div className="doc-rx-medicines-table-wrap">
                <table className="doc-rx-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine Name</th>
                      <th>Timing</th>
                      <th>Intake</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medicines.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>
                          No medicines added yet.
                        </td>
                      </tr>
                    ) : (
                      medicines.map((m, index) => (
                        <tr key={m.id}>
                          <td>{index + 1}</td>
                          <td style={{ fontWeight: 600, color: '#1E293B' }}>{m.name}</td>
                          <td>{m.timing}</td>
                          <td>{m.intake}</td>
                          <td>{m.days}</td>
                          <td>
                            <div className="doc-rx-table-actions">
                              <button className="doc-rx-icon-btn edit" onClick={() => handleEdit(m)}>
                                <FaEdit />
                              </button>
                              <button className="doc-rx-icon-btn delete" onClick={() => handleDelete(m.id)}>
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

    </div>
  );
};

export default DoctorPrescriptions;
