import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import './RescheduleModal.css';

const RescheduleModal = ({ isOpen, onClose, onSave, initialDate, allSchedules, doctorId }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  
  const [currentScheduleId, setCurrentScheduleId] = useState(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getLocalDateString = (d = new Date()) => {
    const y = d.getUTCFullYear ? d.getFullYear() : new Date().getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isPastDate = (year, month, day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(year, month, day);
    return targetDate < today;
  };

  const getSlotStartMinutes = (slotStr) => {
    const startPart = slotStr.split(' to ')[0];
    const match = startPart.match(/(\d+)\.(\d+)(am|pm)/i);
    if (!match) return 0;
    let hrs = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const ampm = match[3].toLowerCase();
    
    if (ampm === 'pm' && hrs < 12) hrs += 12;
    if (ampm === 'am' && hrs === 12) hrs = 0;
    
    return hrs * 60 + mins;
  };

  useEffect(() => {
    if (isOpen) {
      const initDate = initialDate || getLocalDateString();
      setSelectedDate(initDate);
      
      const [y, m, d] = initDate.split('-');
      setCurrentMonth(parseInt(m, 10) - 1);
      setCurrentYear(parseInt(y, 10));
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;
    
    const activeSchedule = allSchedules?.find(s => s.doctorId === doctorId && s.date === selectedDate);
    setCurrentScheduleId(activeSchedule ? activeSchedule.id : null);
    
    if (activeSchedule) {
      let timeArray = [];
      if (Array.isArray(activeSchedule.time)) {
        timeArray = activeSchedule.time;
      } else if (typeof activeSchedule.time === 'string') {
        if (activeSchedule.time.includes(' to ')) {
          const [start, end] = activeSchedule.time.split(' to ');
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
          const st24 = to24h(start);
          const et24 = to24h(end);
          timeArray = generateTimeSlots(st24, et24);
        } else {
          timeArray = [activeSchedule.time];
        }
      }
      setSlots(timeArray);
    } else {
      setSlots([]); // No schedule found for this date
    }
    setEditingIndex(null);
  }, [selectedDate, isOpen, allSchedules, doctorId]);

  const generateTimeSlots = (startStr, endStr) => {
    if (!startStr || !endStr) return [];
    const slots = [];
    const startTime = new Date(`1970-01-01T${startStr}:00Z`);
    const endTime = new Date(`1970-01-01T${endStr}:00Z`);
    
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

  if (!isOpen) return null;

  const handleSave = () => {
    if (!currentScheduleId) {
      alert("Cannot save: No schedule exists for this date to update.");
      return;
    }
    const sortedSlots = [...slots].sort((a, b) => {
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
    onSave(currentScheduleId, selectedDate, sortedSlots);
  };

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

  const formatTime12h = (time24) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hrs = parseInt(h, 10);
    const ampm = hrs >= 12 ? 'pm' : 'am';
    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;
    return `${hrs}.${m}${ampm}`;
  };

  const startEdit = (index, slotString) => {
    setEditingIndex(index);
    if (slotString && slotString.includes(' to ')) {
      const [start, end] = slotString.split(' to ');
      setEditStart(to24h(start));
      setEditEnd(to24h(end));
    } else {
      setEditStart('');
      setEditEnd('');
    }
  };

  const saveEdit = (index) => {
    if(editStart && editEnd) {
      const newSlots = [...slots];
      newSlots[index] = `${formatTime12h(editStart)} to ${formatTime12h(editEnd)}`;
      setSlots(newSlots);
    }
    setEditingIndex(null);
  };

  const deleteSlot = (index) => {
    if (window.confirm("Are you sure you want to delete this specific time slot?")) {
      const newSlots = [...slots];
      newSlots.splice(index, 1);
      setSlots(newSlots);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const emptyPrev = Array.from({ length: firstDay });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    const emptyNext = Array.from({ length: remainingCells });
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthYear = `${monthNames[currentMonth]} ${currentYear}`;
    
    return { emptyPrev, days, emptyNext, monthYear };
  };

  const { emptyPrev, days, emptyNext, monthYear } = getCalendarDays();

  const getDisplayDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    return `${d}/${m}/${y}`;
  };
  const todayLocalStr = getLocalDateString();
  const visibleSlots = slots.filter((slot) => {
    if (selectedDate !== todayLocalStr) return true;
    const slotMinutes = getSlotStartMinutes(slot);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes >= currentMinutes;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2 className="modal-title">Schedule</h2>
        
        <div className="modal-body">
          {/* Calendar Section */}
          <div className="calendar-section">
            <div className="calendar-header">
              <FaChevronLeft className="nav-icon" onClick={handlePrevMonth} style={{cursor: 'pointer'}} />
              <span>{monthYear}</span>
              <FaChevronRight className="nav-icon" onClick={handleNextMonth} style={{cursor: 'pointer'}} />
            </div>
            <div className="calendar-grid">
              <div className="weekday">Sun</div><div className="weekday">Mon</div>
              <div className="weekday">Tue</div><div className="weekday">Wed</div>
              <div className="weekday">Thu</div><div className="weekday">Fri</div>
              <div className="weekday">Sat</div>
              
              {emptyPrev.map((_, i) => <div key={`ep-${i}`} className="day disabled"></div>)}
              
              {days.map((day) => {
                const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                const isPast = isPastDate(currentYear, currentMonth, day);
                
                // Optional: Highlight days that actually have schedules for this doctor
                const hasSchedule = allSchedules?.some(s => s.doctorId === doctorId && s.date === dateStr);
                
                return (
                  <div 
                    key={day} 
                    className={`day ${isPast ? 'disabled' : ''} ${selectedDate === dateStr ? 'selected' : ''}`}
                    onClick={() => {
                      if (!isPast) setSelectedDate(dateStr);
                    }}
                    style={{ position: 'relative' }}
                  >
                    {day.toString().padStart(2, '0')}
                    {hasSchedule && selectedDate !== dateStr && (
                      <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                    )}
                  </div>
                );
              })}
              
              {emptyNext.map((_, i) => <div key={`en-${i}`} className="day disabled"></div>)}
            </div>
          </div>
          
          {/* Time Slots Section */}
          <div className="time-section">
            <h3 className="time-header" style={{ marginBottom: '15px' }}>{getDisplayDate()} Slots</h3>
            <div className="slots-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
              {visibleSlots.length > 0 ? visibleSlots.map((slot, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{slot}</span>
                </div>
              )) : (
                <div style={{color: '#6b7280', fontSize: '14px', textAlign: 'center', marginTop: '20px'}}>No schedule time slot</div>
              )}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="save-btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
