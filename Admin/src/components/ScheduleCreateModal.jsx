import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './RescheduleModal.css'; // Reusing styles from RescheduleModal

const ScheduleCreateModal = ({ isOpen, onClose, onSave, initialDate, initialSlots }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isOpen) {
      const initDate = initialDate || new Date().toISOString().split('T')[0];
      setSelectedDate(initDate);
      setSelectedSlots(initialSlots || []);
      
      const [y, m, d] = initDate.split('-');
      if (y && m) {
        setCurrentMonth(parseInt(m, 10) - 1);
        setCurrentYear(parseInt(y, 10));
      }
    }
  }, [isOpen, initialDate, initialSlots]);

  if (!isOpen) return null;

  // Generate 24 hours slots with 1-hour interval
  const generateFullDaySlots = () => {
    const slots = [];
    const startTime = new Date(`1970-01-01T00:00:00Z`);
    const endTime = new Date(`1970-01-02T00:00:00Z`);
    
    let current = startTime;
    while (current < endTime) {
      let next = new Date(current.getTime() + 60 * 60000); // 1 hour interval
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

  const fullDaySlots = generateFullDaySlots();

  const handleSave = () => {
    onSave(selectedDate, selectedSlots);
  };

  const toggleSlot = (slot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
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

  // Helper to format date for display
  const getDisplayDate = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(y, m - 1, d);
    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dateObj.getDay()];
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${dayName} ${monthNames[m - 1]} ${d}`;
  };

  const formatSlotForDisplay = (slot) => {
    // "9.00am to 9.30am" -> "9:00 AM - 9:30 AM (IST)"
    if (!slot) return '';
    const parts = slot.split(' to ');
    if (parts.length !== 2) return slot;
    
    const formatPart = (p) => {
      const match = p.match(/(\d+)\.(\d+)(am|pm)/i);
      if (!match) return p;
      return `${match[1]}:${match[2].padStart(2, '0')} ${match[3].toUpperCase()}`;
    };
    
    return `${formatPart(parts[0])} - ${formatPart(parts[1])} (IST)`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} type="button">
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
                
                return (
                  <div 
                    key={day} 
                    className={`day ${selectedDate === dateStr ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    {day.toString().padStart(2, '0')}
                  </div>
                );
              })}
              
              {emptyNext.map((_, i) => <div key={`en-${i}`} className="day disabled"></div>)}
            </div>
          </div>
          
          {/* Time Slots Section */}
          <div className="time-section">
            <h3 className="time-header">{getDisplayDate()}</h3>
            <div className="slots-list">
              {fullDaySlots.map((slot, index) => {
                const isSelected = selectedSlots.includes(slot);
                return (
                  <div 
                    key={index} 
                    className={`time-slot ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSlot(slot)}
                  >
                    {formatSlotForDisplay(slot)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="save-btn" onClick={handleSave} type="button">Save</button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCreateModal;
