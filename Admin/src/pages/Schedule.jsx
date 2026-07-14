import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { FaEdit, FaTrash, FaRegCalendarAlt, FaRegClock, FaInfoCircle } from 'react-icons/fa';
import RescheduleModal from '../components/RescheduleModal';
import ScheduleCreateModal from '../components/ScheduleCreateModal';
import Pagination from '../components/Pagination';
import './Schedule.css';

const removeTamil = (text) => {
  if (!text) return '';
  const strText = String(text);
  return strText.split(',').map(item => item.split('/')[0].trim()).join(', ');
};

const Schedule = () => {
  const [doctorsList, setDoctorsList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    doctorId: 0,
    doctorName: '',
    department: '',
    date: '',
    startTime: '',
    endTime: '',
    time: []
  });
  
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditId, setCurrentEditId] = useState(null);
  const [currentDoctorId, setCurrentDoctorId] = useState(null);
  const [modalInitialDate, setModalInitialDate] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  const matchDate = (itemDate, selectedDate) => {
    if (!selectedDate) return true;
    if (!itemDate) return false;
    
    const [y, m, d] = selectedDate.split('-');
    const selectedDDMMYYYY = `${d}/${m}/${y}`;
    const selectedDDMMDotYYYY = `${d}/${m}.${y}`;
    const selectedDDMMDotYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}.${y}`;
    const selectedDDMMYYYYAlt = `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    
    const cleanItemDate = String(itemDate).trim();
    
    return (
      cleanItemDate === selectedDate ||
      cleanItemDate === selectedDDMMYYYY ||
      cleanItemDate === selectedDDMMDotYYYY ||
      cleanItemDate === selectedDDMMDotYYYYAlt ||
      cleanItemDate === selectedDDMMYYYYAlt ||
      cleanItemDate.includes(selectedDDMMYYYY) ||
      cleanItemDate.includes(selectedDDMMDotYYYY)
    );
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (!matchDate(schedule.date, dateFilter)) {
      return false;
    }
    
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    
    const nameClean = String(removeTamil(schedule.doctorName)).toLowerCase();
    const nameRaw = String(schedule.doctorName || '').toLowerCase();
    const deptClean = String(removeTamil(schedule.department)).toLowerCase();
    const deptRaw = String(schedule.department || '').toLowerCase();
    
    return nameClean.includes(search) || nameRaw.includes(search) || deptClean.includes(search) || deptRaw.includes(search);
  }).sort((a, b) => {
    const parseDateForSort = (dateStr) => {
      if (!dateStr) return 0;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`).getTime();
        }
      }
      let cleanStr = dateStr.replace('.', '/');
      if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
        }
      }
      return 0;
    };
    return parseDateForSort(b.date) - parseDateForSort(a.date);
  });

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchSchedulesAndDoctors = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [schedulesRes, doctorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/schedules`, config),
        axios.get(`${API_BASE_URL}/doctors`, config)
      ]);
      
      setSchedules(schedulesRes.data);
      setDoctorsList(doctorsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSchedulesAndDoctors();
  }, []);

  const isDoctorConflict = (doc) => {
    if (!formData.date) return false;
    
    const slots = formData.time && formData.time.length > 0
      ? formData.time
      : generateTimeSlots(formData.startTime, formData.endTime);
      
    if (!slots || slots.length === 0) return false;
    
    return schedules.some(s => {
      if (editingId && s.id === editingId) return false;
      
      const isSameDoc = (s.doctorId && doc.id && String(s.doctorId) === String(doc.id)) ||
                        (s.doctorName && doc.doctorName && s.doctorName.toLowerCase().trim() === doc.doctorName.toLowerCase().trim());
      if (!isSameDoc) return false;
      
      const isSameDate = matchDate(s.date, formData.date);
      if (!isSameDate) return false;
      
      const sTimeArray = Array.isArray(s.time) ? s.time : [s.time];
      return sTimeArray.some(slot => slots.includes(slot));
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'department') {
      setFormData(prev => ({
        ...prev,
        department: value,
        doctorName: '',
        doctorId: 0
      }));
    } else if (name === 'doctorName') {
      const selectedDoc = doctorsList.find(d => d.doctorName === value);
      setFormData(prev => ({
        ...prev,
        doctorName: value,
        department: selectedDoc ? selectedDoc.department : prev.department,
        doctorId: selectedDoc ? selectedDoc.id : 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Get unique departments from doctorsList
  const uniqueDepartments = [...new Set(doctorsList.map(doc => doc.department).filter(Boolean))];

  const generateTimeSlots = (start, end) => {
    if (!start || !end) return [];
    
    const slots = [];
    const startTime = new Date(`1970-01-01T${start}:00Z`);
    const endTime = new Date(`1970-01-01T${end}:00Z`);
    
    let current = startTime;
    while (current < endTime) {
      let next = new Date(current.getTime() + 30 * 60000);
      if (next > endTime) break; 
      
      const formatTime = (d) => {
        let hrs = d.getUTCHours();
        let mins = d.getUTCMinutes();
        const ampm = hrs >= 12 ? 'pm' : 'am';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12; 
        mins = mins < 10 ? '0' + mins : mins;
        return `${hrs}.${mins}${ampm}`;
      };
      
      slots.push(`${formatTime(current)} to ${formatTime(next)}`);
      current = next;
    }
    return slots;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (dateString.includes('/')) return dateString;
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return `${d}/${m}/${y}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedDoc = doctorsList.find(d => d.doctorName === formData.doctorName);
    if (selectedDoc && isDoctorConflict(selectedDoc)) {
      alert("The selected doctor already has a schedule for the chosen date and time slots. / இந்த மருத்துவருக்கு இந்த தேதியிலும் நேரத்திலும் ஏற்கனவே பணி ஒதுக்கீடு செய்யப்பட்டுள்ளது.");
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const generatedSlots = formData.time && formData.time.length > 0 ? formData.time : generateTimeSlots(formData.startTime, formData.endTime);
      
      if (!generatedSlots || generatedSlots.length === 0) {
        alert("Please select a valid time range or slots.");
        return;
      }
      
      const dataToSubmit = { 
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        department: formData.department,
        date: formData.date,
        time: generatedSlots,
        status: 'Approved' // Admin created schedules are auto-approved
      };
      
      if (editingId) {
        await axios.put(`${API_BASE_URL}/schedules/${editingId}`, dataToSubmit, config);
      } else {
        await axios.post(`${API_BASE_URL}/schedules`, dataToSubmit, config);
      }
      
      setFormData({
        doctorId: 0,
        doctorName: '',
        department: '',
        date: '',
        startTime: '',
        endTime: '',
        time: []
      });
      setEditingId(null);
      fetchSchedulesAndDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (schedule) => {
    setEditingId(schedule.id);
    
    let st = '', et = '';
    const timeArray = Array.isArray(schedule.time) ? schedule.time : [schedule.time];
    if (timeArray.length > 0) {
      const firstSlot = timeArray[0];
      const lastSlot = timeArray[timeArray.length - 1];
      
      const to24h = (t) => {
        if(!t) return '';
        const match = t.trim().match(/(\d+)[:.](\d+)\s*(am|pm)/i);
        if (!match) return '';
        let [_, h, m, ampm] = match;
        let hrs = parseInt(h, 10);
        if (ampm.toLowerCase() === 'pm' && hrs < 12) hrs += 12;
        if (ampm.toLowerCase() === 'am' && hrs === 12) hrs = 0;
        return `${hrs.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
      };

      if (firstSlot && firstSlot.includes(' to ')) {
        st = to24h(firstSlot.split(' to ')[0]);
      }
      if (lastSlot && lastSlot.includes(' to ')) {
        et = to24h(lastSlot.split(' to ')[1]);
      }
    }
    
    setFormData({
      doctorId: schedule.doctorId || 0,
      doctorName: schedule.doctorName,
      department: schedule.department,
      date: schedule.date,
      startTime: st,
      time: timeArray
    });

    // Scroll to top
    const wrapper = document.querySelector('.content-wrapper');
    if (wrapper) {
      wrapper.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInfoClick = (schedule) => {
    setCurrentEditId(schedule.id);
    setCurrentDoctorId(schedule.doctorId);
    setModalInitialDate(schedule.date);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const token = sessionStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        await axios.delete(`${API_BASE_URL}/schedules/${id}`, config);
        
        fetchSchedulesAndDoctors();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`${API_BASE_URL}/schedules/${id}`, { status: newStatus }, config);
      fetchSchedulesAndDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReschedule = async (scheduleId, newDate, newTimeArray) => {
    try {
      const token = sessionStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`${API_BASE_URL}/schedules/${scheduleId}`, 
        { date: newDate, time: newTimeArray },
        config
      );
      setIsModalOpen(false);
      fetchSchedulesAndDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const sortTimeSlots = (slotsArr) => {
    if (!Array.isArray(slotsArr)) return slotsArr;
    return [...slotsArr].sort((a, b) => {
      const getMinutes = (slot) => {
        if (!slot || !slot.includes(' to ')) return 0;
        const start = slot.split(' to ')[0];
        const match = start.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
        if (!match) return 0;
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3].toLowerCase();
        if (ampm === 'pm' && hrs < 12) hrs += 12;
        if (ampm === 'am' && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };
      return getMinutes(a) - getMinutes(b);
    });
  };

  const getSummaryTimeString = (timeArray) => {
    if (!Array.isArray(timeArray) || timeArray.length === 0) return timeArray;
    if (timeArray.length === 1) return timeArray[0];
    
    const sortedTimes = sortTimeSlots(timeArray);
    const firstPart = sortedTimes[0].split(' to ')[0];
    const lastPart = sortedTimes[sortedTimes.length - 1].split(' to ')[1];
    
    if (firstPart && lastPart) return `${firstPart} to ${lastPart}`;
    return sortedTimes.join(', ');
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Schedule</h1>
      
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Doctor Name</label>
              <select
                name="doctorName"
                value={formData.doctorName}
                onChange={handleInputChange}
                required
                style={(() => {
                  const selectedDoc = doctorsList.find(d => d.doctorName === formData.doctorName);
                  return selectedDoc && isDoctorConflict(selectedDoc) ? { borderColor: '#ef4444', color: '#ef4444', fontWeight: 'bold' } : undefined;
                })()}
              >
                <option value="" disabled>Select Doctor</option>
                {doctorsList
                  .filter(doc => formData.department === '' || doc.department === formData.department)
                  .map(doc => {
                    const conflict = isDoctorConflict(doc);
                    return (
                      <option
                        key={doc.id}
                        value={doc.doctorName}
                        disabled={conflict}
                        style={conflict ? { color: '#ef4444', backgroundColor: '#fee2e2' } : undefined}
                      >
                        {removeTamil(doc.doctorName)}{conflict ? ' (Already Scheduled / முன்பதிவு செய்யப்பட்டுள்ளது)' : ''}
                      </option>
                    );
                  })}
              </select>
              {(() => {
                const selectedDoc = doctorsList.find(d => d.doctorName === formData.doctorName);
                if (selectedDoc && isDoctorConflict(selectedDoc)) {
                  return (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      ⚠️ This doctor already has a schedule for the selected date and time.
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <div className="form-group">
              <label>Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange} required>
                <option value="" disabled>Select Department</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{removeTamil(dept)}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group date-time-group combined-group">
              <label>Date & Time</label>
              <div 
                className="combined-date-time-input" 
                onClick={() => setIsPickerModalOpen(true)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 16px', height: '48px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff', gap: '30px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaRegCalendarAlt style={{ color: '#9ca3af', fontSize: '15px' }} />
                  <span style={{ color: formData.date ? '#6b7280' : '#9ca3af', fontSize: '14px' }}>
                    {formData.date ? formatDate(formData.date) : "Select Date"}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaRegClock style={{ color: '#9ca3af', fontSize: '15px' }} />
                  <span style={{ color: formData.time && formData.time.length > 0 ? '#6b7280' : '#9ca3af', fontSize: '14px' }}>
                    {formData.time && formData.time.length > 0 ? getSummaryTimeString(formData.time) : "Select Time"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="form-actions-center">
            <button type="submit" className="submit-btn">{editingId ? 'Update' : 'Save Schedule'}</button>
            {editingId && (
              <button 
                type="button" 
                className="submit-btn" 
                style={{marginLeft: '10px', backgroundColor: '#e5e7eb', color: 'black'}} 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    doctorId: 0,
                    doctorName: '',
                    department: '',
                    date: '',
                    startTime: '',
                    endTime: '',
                    time: []
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h2 className="list-title">List:</h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none', color: '#4b5563' }}
          />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', width: '250px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Department</th>
              <th>Date & Time</th>
              <th>Approval</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSchedules.map(schedule => {
              const cleanDept = schedule.department ? removeTamil(schedule.department) : '';
              const departments = cleanDept ? cleanDept.split(', ') : [];
              const visibleDepartments = departments.slice(0, 3);
              const hiddenDepartments = departments.slice(3);
              
              return (
              <tr key={schedule.id}>
                <td>{removeTamil(schedule.doctorName)}</td>
                <td>
                  <div className="dept-cell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {visibleDepartments.join(', ')}
                    {hiddenDepartments.length > 0 && (
                      <div className="tooltip-container">
                        <span className="dept-badge">+{hiddenDepartments.length}</span>
                        <div className="tooltip-text">{hiddenDepartments.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {formatDate(schedule.date)} {getSummaryTimeString(schedule.time)}
                    <FaInfoCircle 
                      style={{ color: '#1173ba', cursor: 'pointer', fontSize: '16px' }} 
                      title="View/Reschedule Slots"
                      onClick={() => handleInfoClick(schedule)} 
                    />
                  </div>
                </td>
                <td>
                  {schedule.status === 'Pending' || !schedule.status ? (
                    <div className="approval-actions">
                      <button className="approve-btn" onClick={() => handleStatusUpdate(schedule.id, 'Approved')}>Approve</button>
                      <button className="reject-btn" onClick={() => handleStatusUpdate(schedule.id, 'Rejected')}>Reject</button>
                    </div>
                  ) : (
                    <span className={`status-badge status-${schedule.status.toLowerCase()}`}>
                      {schedule.status}
                    </span>
                  )}
                </td>
                <td className="actions-cell">
                  <button className="action-btn" title="Edit Full Schedule" onClick={() => handleEditClick(schedule)}>
                    <FaEdit />
                  </button>
                  <button className="action-btn" title="Delete Schedule" onClick={() => handleDelete(schedule.id)}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
              );
            })}
            {filteredSchedules.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No schedules found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredSchedules.length}
        itemsPerPage={itemsPerPage}
      />

      <RescheduleModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveReschedule}
        initialDate={modalInitialDate}
        allSchedules={schedules}
        doctorId={currentDoctorId}
      />
      
      <ScheduleCreateModal
        isOpen={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
        onSave={(date, slots) => {
          setFormData(prev => ({ ...prev, date, time: slots }));
          setIsPickerModalOpen(false);
        }}
        initialDate={formData.date}
        initialSlots={formData.time}
        doctorId={formData.doctorId}
        doctorName={formData.doctorName}
        allSchedules={schedules}
        editingId={editingId}
      />
    </div>
  );
};

export default Schedule;
