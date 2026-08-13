import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaCheck } from 'react-icons/fa';

const parseTimeStringToMinutes = (timeStr) => {
  try {
    let clean = timeStr.toLowerCase().replace(/\s+/g, ' ').trim();
    let isPM = clean.includes('pm');
    let isAM = clean.includes('am');
    clean = clean.replace('am', '').replace('pm', '').trim();

    let hours = -1;
    let minutes = 0;

    if (clean.includes(':') || clean.includes('.')) {
      let parts = clean.split(/[:.]/);
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    } else {
      const spaceParts = clean.split(/\s+/);
      if (spaceParts.length >= 2) {
        hours = parseInt(spaceParts[0], 10);
        minutes = parseInt(spaceParts[1], 10);
      } else {
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length === 3) {
          hours = parseInt(digitsOnly.substring(0, 1), 10);
          minutes = parseInt(digitsOnly.substring(1, 3), 10);
        } else if (digitsOnly.length === 4) {
          hours = parseInt(digitsOnly.substring(0, 2), 10);
          minutes = parseInt(digitsOnly.substring(2, 4), 10);
        } else if (digitsOnly.length === 1 || digitsOnly.length === 2) {
          hours = parseInt(digitsOnly, 10);
          minutes = 0;
        }
      }
    }

    if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
      return -1;
    }

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  } catch (err) {
    return -1;
  }
};

const formatDate = (rawDate) => {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

const AdminAppointmentCreate = ({ onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  // Data States
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [dateSchedules, setDateSchedules] = useState([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState([]);
  const [doctorCategories, setDoctorCategories] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [availableTimings, setAvailableTimings] = useState([]);

  // Form States
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [whatsapp, setWhatsapp] = useState('');
  const [mobile, setMobile] = useState('');

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [bookedMap, setBookedMap] = useState({});

  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [appointmentType, setAppointmentType] = useState('Offline');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [patientsRes, docsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/patients`, config),
        axios.get(`${API_BASE_URL}/doctors`, config)
      ]);

      if (patientsRes.data) {
        setRegisteredPatients(patientsRes.data);
      }
      if (docsRes.data) {
        setAllDoctors(docsRes.data);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handlePatientSelect = (patient) => {
    if (patient) {
      setSelectedPatientId(patient._id || patient.id);
      setPatientName(patient.patient_name || '');
      setAge(patient.patient_age ? String(patient.patient_age) : '');
      if (patient.gender) setGender(patient.gender);
      setWhatsapp(patient.identifier || patient.emergency_contact || '');
      setMobile(patient.identifier || patient.emergency_contact || '');
      setPatientSearchTerm(`${patient.patient_name || 'Unknown'} - ${patient.identifier || patient.emergency_contact || 'No Number'}`);
    } else {
      setSelectedPatientId('');
      setPatientName('');
      setAge('');
      setGender('Male');
      setWhatsapp('');
      setMobile('');
      setPatientSearchTerm('');
    }
    setShowPatientDropdown(false);
  };

  useEffect(() => {
    if (appointmentDate) {
      fetchSchedulesForDate(appointmentDate);
    } else {
      setAvailableDoctorsForDate([]);
      setDoctorCategories([]);
      setDoctorList([]);
      setAvailableTimings([]);
      setSelectedCategory('');
      setSelectedDoctor('');
      setSelectedTime('');
    }
  }, [appointmentDate]);

  const fetchSchedulesForDate = async (selectedDate) => {
    try {
      setAvailableTimings([]);
      setSelectedTime('');

      const d = new Date(selectedDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDateForSchedules = `${year}-${month}-${day}`;
      const formattedDateForAppointments = formatDate(selectedDate);

      const [schedulesRes, appointmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/schedules?date=${formattedDateForSchedules}`),
        axios.get(`${API_BASE_URL}/emails/booked-timings?appointment_date=${encodeURIComponent(formattedDateForAppointments)}&_t=${Date.now()}`)
      ]);

      const approvedSchedules = (schedulesRes.data || []).filter(s => {
        if (s.status !== 'Approved') return false;
        return allDoctors.some(doc =>
          (doc._id === s.doctorId || doc.id === s.doctorId) ||
          (doc.doctorName === s.doctorName)
        );
      });
      setDateSchedules(approvedSchedules);

      const appointments = appointmentsRes.data || [];
      const localBookedMap = {};
      appointments.forEach(app => {
        if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
        const docName = (app.doctor_name || '').trim();
        if (!localBookedMap[docName]) localBookedMap[docName] = [];
        localBookedMap[docName].push((app.appointment_time || '').trim());
      });
      setBookedMap(localBookedMap);

      const activeDocsWithSchedules = allDoctors.filter(doc =>
        approvedSchedules.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
      );
      setAvailableDoctorsForDate(activeDocsWithSchedules);

      const uniqueDepts = new Set();
      activeDocsWithSchedules.forEach(doc => {
        if (doc.department) {
          doc.department.split(',').forEach(dep => {
            const fullDeptName = dep.trim();
            if (fullDeptName) uniqueDepts.add(fullDeptName);
          });
        }
      });

      const departments = Array.from(uniqueDepts);
      const formattedCategories = departments.map((cat, index) => {
        const originalName = cat.split('/')[0].trim();
        return {
          id: String(index + 1),
          name: originalName,
          fullDepartment: cat
        };
      });

      setDoctorCategories(formattedCategories);
      setSelectedCategory('');
      setSelectedDoctor('');
      setDoctorList([]);
    } catch (error) {
      console.error("Error fetching schedules", error);
    }
  };

  const handleCategorySelect = (e) => {
    const catName = e.target.value;
    setSelectedCategory(catName);
    setSelectedDoctor('');
    setSelectedTime('');
    setAvailableTimings([]);

    if (catName) {
      const selectedCatObj = doctorCategories.find(c => c.name === catName);
      if (selectedCatObj) {
        const docsForCategory = availableDoctorsForDate.filter(doc => {
          if (!doc.department) return selectedCatObj.name === 'Others';
          const depts = doc.department.split(',').map(c => c.trim());
          return depts.includes(selectedCatObj.fullDepartment);
        });
        setDoctorList(docsForCategory);
      }
    } else {
      setDoctorList([]);
    }
  };

  const handleDoctorSelect = (e) => {
    const docId = e.target.value;
    setSelectedDoctor(docId);
    setSelectedTime('');

    if (docId) {
      const doc = doctorList.find(d => String(d._id) === String(docId) || String(d.id) === String(docId));
      if (doc) {
        const schedulesForDoctor = dateSchedules.filter(s =>
          String(s.doctorId) === String(doc._id) ||
          String(s.doctorId) === String(doc.id) ||
          s.doctorName === doc.doctorName
        );

        if (schedulesForDoctor.length > 0) {
          const allTimings = schedulesForDoctor.flatMap(s => s.time || []);
          let uniqueTimings = [...new Set(allTimings)];

          // Exclude past timings if today
          const today = new Date();
          const d = new Date(appointmentDate);
          const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

          if (isToday) {
            const currentMinutes = today.getHours() * 60 + today.getMinutes();
            uniqueTimings = uniqueTimings.filter(t => {
              const startStr = t.split(/to|\-/)[0].trim();
              const startMins = parseTimeStringToMinutes(startStr);
              return startMins > currentMinutes;
            });
          }
          setAvailableTimings(uniqueTimings);
        } else {
          setAvailableTimings([]);
        }
      }
    } else {
      setAvailableTimings([]);
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) return alert("Please enter patient name.");
    if (!age.trim()) return alert("Please enter age.");
    if (!appointmentDate) return alert("Please select appointment date.");
    if (!selectedCategory) return alert("Please select treatment category.");
    if (!selectedDoctor) return alert("Please select doctor.");
    if (!selectedTime) return alert("Please select appointment timing.");
    if (!mobile.trim()) return alert("Please enter patient mobile.");

    const doc = doctorList.find(d => String(d._id) === String(selectedDoctor) || String(d.id) === String(selectedDoctor));
    const consultFee = doc ? (doc.fees || 0) : 0;

    const payload = {
      patient_name: patientName,
      patient_age: age,
      patient_gender: gender,
      whatsapp_number: whatsapp,
      login_mobile: mobile,
      treatment_category: selectedCategory,
      doctor_name: doc ? doc.doctorName : "N/A",
      appointment_date: formatDate(appointmentDate),
      appointment_time: selectedTime,
      appointment_type: appointmentType,
      created_by: sessionStorage.getItem('role') || 'Admin',
      video_call: (appointmentType === 'Online' && isVideoCall) ? "Yes" : "No",
      consultation_fee: Number(consultFee) || 0,
      payment_id: 'CASH_' + Date.now(),
      payment_method: 'Cash',
      payment_status: 'Pending',
    };

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/emails/book`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.status === 200 || response.data.message) {
        alert("Appointment Request Sent Successfully!");
        onSuccess(); // Switch back to list
      } else {
        alert("Error sending appointment request.");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      alert("Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ fontSize: '20px', color: '#1a4d80', fontWeight: '700', margin: 0 }}>Booking Appointment</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="appointment-type-toggle" style={{ margin: 0 }}>
            <button
              className={`type-btn ${appointmentType === 'Online' ? 'active' : ''}`}
              onClick={() => setAppointmentType('Online')}
            >
              Online
            </button>
            <button
              className={`type-btn ${appointmentType === 'Offline' ? 'active' : ''}`}
              onClick={() => {
                setAppointmentType('Offline');
                setIsVideoCall(false);
              }}
            >
              Offline
            </button>
          </div>
          <button className="back-btn" onClick={onCancel}>Back to List</button>
        </div>
      </div>

      <div className="form-grid">
        {/* Left Column: Patient Details */}
        <div>
          <div className="form-section-title">Patient Details</div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label>Select Registered Patient (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="-- Search Registered Patient --"
              value={patientSearchTerm}
              onChange={(e) => {
                setPatientSearchTerm(e.target.value);
                setShowPatientDropdown(true);
                if (!e.target.value) handlePatientSelect(null);
              }}
              onFocus={() => setShowPatientDropdown(true)}
            />
            {showPatientDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', color: '#64748b' }} onClick={() => handlePatientSelect(null)}>
                  -- Clear Selection --
                </div>
                {registeredPatients.filter(p => {
                  const search = patientSearchTerm.toLowerCase();
                  return (p.patient_name || '').toLowerCase().includes(search) || (p.identifier || p.emergency_contact || '').toLowerCase().includes(search);
                }).map(p => (
                  <div key={p._id || p.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onClick={() => handlePatientSelect(p)}>
                    {p.patient_name || 'Unknown'} - {p.identifier || p.emergency_contact || 'No Number'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Patient Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter patient name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Age *</label>
              <input
                type="number"
                className="form-input"
                placeholder="00"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Gender *</label>
              <div className="gender-container">
                <button
                  className={`gender-btn ${gender === 'Male' ? 'active' : ''}`}
                  onClick={() => setGender('Male')}
                >
                  Male
                </button>
                <button
                  className={`gender-btn ${gender === 'Female' ? 'active' : ''}`}
                  onClick={() => setGender('Female')}
                >
                  Female
                </button>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>WhatsApp No</label>
              <input
                type="text"
                className="form-input"
                placeholder="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Patient Mobile *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Appointment Details */}
        <div>
          <div className="form-section-title">Appointment Details</div>

          <div className="form-group" style={{ marginTop: '15px' }}>
            <label>Select Appointment Date *</label>
            <input
              type="date"
              className="form-input"
              value={appointmentDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Select Treatment Category *</label>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={handleCategorySelect}
              disabled={!appointmentDate}
            >
              <option value="">{appointmentDate ? (doctorCategories.length > 0 ? "Select category" : "No categories found for this date") : "Select date first"}</option>
              {doctorCategories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Select Doctor *</label>
            <select
              className="form-select"
              value={selectedDoctor}
              onChange={handleDoctorSelect}
              disabled={!selectedCategory}
            >
              <option value="">{selectedCategory ? (doctorList.length > 0 ? "Select doctor" : "No doctors found") : "Select category first"}</option>
              {doctorList.map(d => (
                <option key={d._id || d.id} value={d._id || d.id}>{d.doctorName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Available Timing Slots *</label>
            {availableTimings.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                {availableTimings.map((t, idx) => {
                  const doc = doctorList.find(d => String(d._id) === String(selectedDoctor) || String(d.id) === String(selectedDoctor));
                  const docName = doc ? (doc.doctorName || '').trim() : '';
                  const isBooked = bookedMap[docName] && bookedMap[docName].includes(t.trim());

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!isBooked) setSelectedTime(t);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        border: isBooked ? '1px solid #ef4444' : (selectedTime === t ? '1px solid #10b981' : '1px solid #cbd5e1'),
                        borderRadius: '6px',
                        cursor: isBooked ? 'not-allowed' : 'pointer',
                        background: isBooked ? '#fef2f2' : (selectedTime === t ? '#d1fae5' : '#fff'),
                        color: isBooked ? '#ef4444' : (selectedTime === t ? '#10b981' : '#475569'),
                        fontSize: '13px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '4px', border: selectedTime === t ? 'none' : '1px solid #cbd5e1',
                        background: selectedTime === t ? '#10b981' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {selectedTime === t && <FaCheck size={10} color="#fff" />}
                      </div>
                      {t}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', margin: 0, marginTop: '8px' }}>
                {selectedDoctor ? "No timings available." : "No timings available for selected date/doctor."}
              </p>
            )}
          </div>

          {appointmentType === 'Online' && (
            <div className="form-group" style={{ marginTop: '24px' }}>
              <div
                className={`video-box ${isVideoCall ? 'active' : ''}`}
                onClick={() => setIsVideoCall(!isVideoCall)}
              >
                <input type="checkbox" checked={isVideoCall} readOnly />
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>Video Call Consult</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Request video consultation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '30px', padding: '0', border: 'none', boxShadow: 'none', background: 'transparent' }}>
        <button className="btn-cancel" style={{ flex: '1', maxWidth: '280px', padding: '14px', borderRadius: '20px', border: 'none' }} onClick={onCancel} disabled={loading}>Cancel</button>
        <button className={`btn-confirm ${patientName && appointmentDate && selectedCategory && selectedDoctor && selectedTime ? 'active' : ''}`} style={{ flex: '1', maxWidth: '280px', padding: '14px', backgroundColor: '#586ff5', color: 'white', borderRadius: '20px', border: 'none' }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  );
};

export default AdminAppointmentCreate;
