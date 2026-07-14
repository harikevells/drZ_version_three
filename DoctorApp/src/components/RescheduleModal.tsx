import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { Calendar } from 'react-native-calendars';

interface Props {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  doctorName: string;
}

import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/appointments`;

export default function RescheduleModal({ visible, onClose, patientId, doctorName }: Props) {
  const [selectedTime, setSelectedTime] = useState('');
  const [date, setDate] = useState('');
  const [bookedTimings, setBookedTimings] = useState<string[]>([]);
  const [availableTimings, setAvailableTimings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allSchedules, setAllSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      
      setDate(`${dd}/${mm}/${yyyy}`);
      setSelectedTime('');
      setBookedTimings([]);
      setAvailableTimings([]);
      setShowCalendar(false);
      
      if (doctorName) {
        fetchAllSchedules();
      }
    } else {
      setDate('');
    }
  }, [visible, doctorName]);

  const fetchAllSchedules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/schedules?doctorName=${encodeURIComponent(doctorName)}`);
      if (res.data && Array.isArray(res.data)) {
        setAllSchedules(res.data);
      }
    } catch (e) {
      console.log('Error fetching all schedules', e);
    }
  };

  useEffect(() => {
    if (date.length === 10 && doctorName) {
      fetchDateData();
    } else {
      setBookedTimings([]);
      setAvailableTimings([]);
    }
  }, [date, doctorName]);

  const fetchDateData = async () => {
    setLoading(true);
    try {
      const bookedRes = await axios.get(`${API_URL}/booked/${encodeURIComponent(doctorName)}/${encodeURIComponent(date)}`);
      const normalizedBooked = bookedRes.data.bookedTimes.map((t: string) => t.split(' to ')[0].trim().toLowerCase());
      setBookedTimings(normalizedBooked);

      // Convert DD/MM/YYYY to YYYY-MM-DD for Schedule API
      const parts = date.split('/');
      const scheduleDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

      const scheduleRes = await axios.get(`${API_BASE_URL}/schedules?doctorName=${encodeURIComponent(doctorName)}&date=${encodeURIComponent(scheduleDate)}`);
      if (scheduleRes.data && scheduleRes.data.length > 0) {
        const approvedSchedules = scheduleRes.data.filter((s: any) => s.status === 'Approved');
        const schedulesToProcess = approvedSchedules.length > 0 ? approvedSchedules : scheduleRes.data;
        
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const currentFloat = today.getHours() + today.getMinutes() / 60;
        
        let allValidSlots: string[] = [];
        
        schedulesToProcess.forEach((schedule: any) => {
          let validSlots = schedule.time || [];

          if (date === `${dd}/${mm}/${yyyy}`) {
            validSlots = validSlots.filter((fullStr: string) => {
              const lowerStr = fullStr.toLowerCase();
              let parts = lowerStr.split(' to ');
              if (parts.length === 1) parts = lowerStr.split('-');
              
              const compareStr = parts.length > 1 ? parts[1].trim() : parts[0].trim();
              
              const isPM = compareStr.includes('pm');
              const clean = compareStr.replace('am', '').replace('pm', '').trim();
              const timeParts = clean.includes('.') ? clean.split('.') : clean.split(':');
              let hours = parseInt(timeParts[0], 10) || 0;
              const mins = parseInt(timeParts[1], 10) || 0;
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
              let slotFloat = hours + mins / 60;
              
              if (parts.length === 1) {
                slotFloat += 1.0;
              }
              
              return slotFloat >= currentFloat;
            });
          }
          
          allValidSlots = [...allValidSlots, ...validSlots];
        });
        
        let normalizedAvailable = allValidSlots.map((t: string) => {
          let parts = t.toLowerCase().split(' to ');
          if (parts.length === 1) parts = t.toLowerCase().split('-');
          return parts[0].trim();
        });
        
        normalizedAvailable = Array.from(new Set(normalizedAvailable));
        
        setAvailableTimings(normalizedAvailable);
      } else {
        setAvailableTimings([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!date || date.length !== 10) {
      Alert.alert('Invalid Date', 'Please enter a valid date in DD/MM/YYYY format.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('No Time Selected', 'Please select an available timing.');
      return;
    }
    
    try {
      await axios.put(`${API_URL}/${patientId}/status`, { 
        status: 'Rescheduled',
        appointment_date: date,
        appointment_time: selectedTime
      });
      Alert.alert('Success', 'Appointment rescheduled successfully!');
      onClose();
    } catch (error) {
      console.error('Error rescheduling:', error);
      Alert.alert('Error', 'Failed to reschedule appointment.');
    }
  };

  const onDayPress = (day: any) => {
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const parts = day.dateString.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    
    if (formattedDate === date) {
      // User tapped the same date, force a refetch to show newly created schedules
      fetchDateData();
      fetchAllSchedules();
    } else {
      setDate(formattedDate);
    }
    
    setShowCalendar(false);
  };

  const getMarkedDates = () => {
    const marks: any = {};
    const today = new Date();
    
    // Mark next 90 days as disabled by default (grey)
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateString = d.toISOString().split('T')[0];
      marks[dateString] = { disabled: true, disableTouchEvent: true };
    }
    
    // Highlight available schedule dates in black
    allSchedules.forEach(schedule => {
      if (schedule.status === 'Approved' && schedule.time && schedule.time.length > 0) {
        let dateKey = schedule.date;
        if (dateKey && dateKey.includes('/')) {
          const parts = dateKey.split('/');
          dateKey = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (dateKey) {
          marks[dateKey] = {
            disabled: false,
            disableTouchEvent: false,
            customStyles: {
              container: { backgroundColor: '#FFF', borderRadius: 6 },
              text: { color: '#000', fontWeight: 'bold' }
            }
          };
        }
      }
    });

    // Highlight the currently selected date
    if (date) {
      const parts = date.split('/');
      const selectedKey = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (marks[selectedKey]) {
        marks[selectedKey] = {
           ...marks[selectedKey],
           customStyles: {
              container: { backgroundColor: '#052A3F', borderRadius: 6 },
              text: { color: '#FFF', fontWeight: 'bold' }
           }
        };
      }
    }

    return marks;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Reschedule appointment</Text>
          
          <Text style={styles.label}>Select Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setShowCalendar(!showCalendar)}>
            <Text style={{flex: 1, paddingVertical: 10, color: date ? '#333' : '#999'}}>
              {date || "DD/MM/YYYY"}
            </Text>
            {loading ? <ActivityIndicator size="small" color="#2CA01C" /> : <Ionicons name="calendar-outline" size={20} color="#666" />}
          </TouchableOpacity>

          {showCalendar && (
            <View style={styles.calendarContainer}>
              <Calendar
                markingType={'custom'}
                markedDates={getMarkedDates()}
                onDayPress={onDayPress}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  arrowColor: '#052A3F',
                  textDisabledColor: '#B0B0B0',
                }}
              />
            </View>
          )}

          <Text style={styles.label}>Select Available Timings</Text>
          {date && availableTimings.length === 0 && !loading && (
            <Text style={{color: '#FF4C4C', marginBottom: 15, fontSize: 12}}>No timings scheduled for this date.</Text>
          )}
          <View style={styles.gridContainer}>
            <View style={styles.grid}>
              {availableTimings.map((time) => {
                const isBooked = bookedTimings.includes(time);
                const isSelected = selectedTime === time && !isBooked;
                return (
                  <TouchableOpacity 
                    key={time} 
                    style={styles.timeSlotRow}
                    onPress={() => !isBooked && setSelectedTime(time)}
                    disabled={isBooked}
                  >
                    <View style={[
                      styles.squareCheckbox,
                      isSelected ? styles.squareSelected : null,
                      isBooked ? styles.squareBooked : null
                    ]} />
                    <Text style={[
                      styles.timeText,
                      isBooked ? styles.timeTextBooked : null
                    ]}>{time}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 25,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  dateInput: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridContainer: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 20,
    marginBottom: 25,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlotRow: {
    width: '32%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  squareCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#EEEEEE',
    marginRight: 8,
  },
  squareSelected: {
    backgroundColor: '#2CA01C',
  },
  squareBooked: {
    backgroundColor: '#FF0000',
  },
  timeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  timeTextBooked: {
    color: '#FF0000',
    textDecorationLine: 'line-through',
  },
  confirmBtn: {
    backgroundColor: '#0084FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
