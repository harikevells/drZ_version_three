import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaRegCalendarAlt, FaRegClock, FaInfoCircle } from 'react-icons/fa';
import RescheduleModal from '../components/RescheduleModal';
import ScheduleCreateModal from '../components/ScheduleCreateModal';
import Pagination from '../components/Pagination';
import './Schedule.css';

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const fetchSchedulesAndDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [schedulesRes, doctorsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/schedules', config),
        axios.get('http://localhost:5000/api/doctors', config)
      ]);
      
      setSchedules(schedulesRes.data);
      setDoctorsList(doctorsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeTamil = (text) => {
    if (!text) return text;
    return text.split(',').map(item => item.split('/')[0].trim()).join(', ');
  };

  useEffect(() => {
    fetchSchedulesAndDoctors();
  }, []);

  const filteredSchedules = schedules.filter(schedule => {
    const searchLower = searchTerm.toLowerCase();
    const timeString = Array.isArray(schedule.time) ? schedule.time.join(' ') : (schedule.time || '');
    const matchesSearch = 
      (schedule.doctorName || '').toLowerCase().includes(searchLower) ||
      (schedule.department || '').toLowerCase().includes(searchLower) ||
      timeString.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (filterDate) {
      const [y, m, d] = filterDate.split('-');
      const normalizedFilter = `${d}/${m}/${y}`;
      const schedDate = schedule.date || '';
      matchesDate = schedDate.replace(/\s+/g, '') === normalizedFilter.replace(/\s+/g, '');
    }

    return matchesSearch && matchesDate;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDate]);

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
    return `${d}/${m}.${y}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
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
        await axios.put(`http://localhost:5000/api/schedules/${editingId}`, dataToSubmit, config);
      } else {
        await axios.post('http://localhost:5000/api/schedules', dataToSubmit, config);
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
      endTime: et,
      time: timeArray
    });
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
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        await axios.delete(`http://localhost:5000/api/schedules/${id}`, config);
        
        fetchSchedulesAndDoctors();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`http://localhost:5000/api/schedules/${id}`, { status: newStatus }, config);
      fetchSchedulesAndDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReschedule = async (scheduleId, newDate, newTimeArray) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`http://localhost:5000/api/schedules/${scheduleId}`, 
        { date: newDate, time: newTimeArray },
        config
      );
      setIsModalOpen(false);
      fetchSchedulesAndDoctors();
    } catch (err) {
      console.error(err);
    }
  };

  const getSummaryTimeString = (timeArray) => {
    if (!Array.isArray(timeArray) || timeArray.length === 0) return timeArray;
    if (timeArray.length === 1) return timeArray[0];
    const firstPart = timeArray[0].split(' to ')[0];
    const lastPart = timeArray[timeArray.length - 1].split(' to ')[1];
    if (firstPart && lastPart) return `${firstPart} to ${lastPart}`;
    return timeArray.join(', ');
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Schedule</h1>
      
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Doctor Name</label>
              <select name="doctorName" value={formData.doctorName} onChange={handleInputChange} required>
                <option value="" disabled>Select Doctor</option>
                {doctorsList
                  .filter(doc => formData.department === '' || doc.department === formData.department)
                  .map(doc => (
                  <option key={doc.id} value={doc.doctorName}>{removeTamil(doc.doctorName)}</option>
                ))}
              </select>
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
                style={{marginLeft: '10px', backgroundColor: '#6b7280'}} 
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

      <div className="list-header">
        <h2 className="list-title">List:</h2>
      </div>

      <div className="filters-container">
        <input 
          type="text" 
          placeholder="Search by Doctor or Department..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input 
          type="date" 
          value={filterDate} 
          onChange={(e) => setFilterDate(e.target.value)}
          className="date-input"
        />
        {(searchTerm || filterDate) && (
          <button className="clear-filter-btn" onClick={() => { setSearchTerm(''); setFilterDate(''); }}>Clear</button>
        )}
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
            {filteredSchedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(schedule => {
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
            {schedules.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No schedules found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(filteredSchedules.length / itemsPerPage)} 
        onPageChange={setCurrentPage} 
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
      />
    </div>
  );
};

export default Schedule;
