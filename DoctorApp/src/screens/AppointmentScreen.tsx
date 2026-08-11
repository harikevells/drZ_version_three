import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView, RefreshControl, TextInput, Modal, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CompleteModal from '../components/CompleteModal';
import CancelModal from '../components/CancelModal';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

import { API_BASE_URL } from '../config';
const API_URL = `${API_BASE_URL}/appointments`;

const formatTimeSlot = (timeStr: string) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (str.toLowerCase().includes('to') || str.includes('-')) return str;

  const match = str.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
  if (!match) return str;

  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();

  let hrs24 = hrs;
  if (ampm === 'pm' && hrs24 < 12) hrs24 += 12;
  if (ampm === 'am' && hrs24 === 12) hrs24 = 0;

  let eMins = mins;
  let eHrs = hrs24 + 1;
  if (eHrs >= 24) { eHrs -= 24; }

  const eAmpm = eHrs >= 12 ? 'pm' : 'am';
  let dHrs = eHrs % 12;
  if (dHrs === 0) dHrs = 12;

  const eMinsStr = eMins < 10 ? '0' + eMins : eMins;
  return `${dHrs}:${eMinsStr} ${eAmpm.toUpperCase()}`;
};

const getLeftBorderColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return '#4871F7';
    case 'rescheduled': return '#8B5CF6';
    case 'approved': return '#10B981';
    case 'completed': return '#10B981';
    case 'cancelled': return '#EF4444';
    default: return '#E5E7EB';
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return { bg: '#FEF3C7', text: '#D97706', icon: null };
    case 'rescheduled': return { bg: '#E0E7FF', text: '#4338CA', icon: null };
    case 'approved': return { bg: '#D1FAE5', text: '#059669', icon: 'checkmark' };
    case 'completed': return { bg: '#D1FAE5', text: '#059669', icon: 'checkmark' };
    case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626', icon: 'close' };
    default: return { bg: '#F3F4F6', text: '#4B5563', icon: null };
  }
};

const getAvatarBg = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'rescheduled': return '#8B5CF6';
    case 'pending': return '#4871F7';
    case 'approved': return '#10B981';
    default: return '#14B8A6'; 
  }
};

const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

const parseDateStr = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  return null;
};

export default function AppointmentScreen({ route }: any) {
  const [parseableDate, setParseableDate] = useState(false);
  const [fromDateInput, setFromDateInput] = useState('');
  const [toDateInput, setToDateInput] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');
  const [showCalendar, setShowCalendar] = useState<'from' | 'to' | null>(null);

  const flatListRef = React.useRef<FlatList>(null);
  const blinkAnim = React.useRef(new Animated.Value(0)).current;
  const hasBlinkedRef = React.useRef(false);
  const lastTimestampRef = React.useRef<number | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Completed' | 'Cancelled'>(route?.params?.activeTab || 'Pending');
  const [doctorName, setDoctorName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [expandedPrescriptions, setExpandedPrescriptions] = useState<Record<string, boolean>>({});

  const filteredAppointments = appointments.filter(app => {
    if (!app.status) return false;
    const s = app.status.toLowerCase();

    let matchesTab = false;
    if (activeTab === 'Pending') {
      matchesTab = s === 'pending' || s === 'rescheduled';
    } else {
      matchesTab = s === activeTab.toLowerCase();
    }
    if (!matchesTab) return false;

    if (appliedFromDate || appliedToDate) {
      const appDate = parseDateStr(app.appointment_date);
      const start = parseDateStr(appliedFromDate);
      const end = parseDateStr(appliedToDate);

      if (appDate) {
        if (start && appDate < start) return false;
        if (end && appDate > end) return false;
      }
    }

    return true;
  });

  const fetchAppointments = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        fetchUnreadCount(user.doctorName);
        const response = await axios.get(`${API_URL}/all/${encodeURIComponent(user.doctorName)}`);
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Could not load appointments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchAppointments(appointments.length === 0);
      if (doctorName) fetchUnreadCount(doctorName);
    }
  }, [isFocused, doctorName]);

  useEffect(() => {
    let isNewNotification = false;
    const currentTimestamp = route?.params?._timestamp;

    if (currentTimestamp && currentTimestamp !== lastTimestampRef.current) {
      isNewNotification = true;
      hasBlinkedRef.current = false;
      lastTimestampRef.current = currentTimestamp;
    }

    if (hasBlinkedRef.current) return;

    let targetId = route?.params?.highlightBookingId;
    const hMessage = route?.params?.highlightMessage;

    let foundApp = null;

    if (targetId && appointments.length > 0) {
      foundApp = appointments.find(app => app.booking_id === targetId || app.id === targetId || app._id === targetId);
    } else if (!targetId && hMessage && appointments.length > 0) {
      const msg = hMessage.toLowerCase();
      // Only match by patient name because if the appointment is rescheduled, the old date in the notification won't match the new appointment date.
      // We reverse the array to find the latest appointment for that patient, as find() returns the first match.
      const reversedAppointments = [...appointments].reverse();
      foundApp = reversedAppointments.find(app => {
        return app.patient_name && msg.includes(app.patient_name.toLowerCase());
      });
      if (foundApp) {
        targetId = foundApp.id || foundApp._id;
      }
    }

    if (foundApp && foundApp.status) {
      const statusMap: any = {
        'pending': 'Pending',
        'approved': 'Approved',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'rescheduled': 'Pending'
      };
      const correctTab = statusMap[foundApp.status.toLowerCase()];
      if (correctTab && correctTab !== activeTab) {
        setActiveTab(correctTab);
      }
    } else if (isNewNotification && route?.params?.activeTab) {
      // If no appointment was found but it's a new navigation, at least set the requested tab
      setActiveTab(route.params.activeTab);
    }

    if (targetId) {
      hasBlinkedRef.current = true;
      setHighlightedBookingId(targetId);

      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          })
        ])
      ).start();

      const timer = setTimeout(() => {
        setHighlightedBookingId(null);
        blinkAnim.setValue(0);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [route?.params?.activeTab, route?.params?.highlightBookingId, route?.params?.highlightMessage, appointments]);

  useEffect(() => {
    if (highlightedBookingId && appointments.length > 0) {
      const index = filteredAppointments.findIndex((app: any) =>
        app.booking_id === highlightedBookingId ||
        app.id === highlightedBookingId ||
        app._id === highlightedBookingId
      );
      if (index !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }, 500);
      }
    }
  }, [highlightedBookingId, filteredAppointments]);

  const removeBlink = (item: any) => {
    if (
      highlightedBookingId &&
      (item.booking_id === highlightedBookingId || item.id === highlightedBookingId || item._id === highlightedBookingId)
    ) {
      setHighlightedBookingId(null);
      blinkAnim.setValue(0);
    }
  };

  const fetchUnreadCount = async (name: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/doctor/${name}`);
      const count = response.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error fetching notification count:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      Alert.alert('Success', `Appointment ${status.toLowerCase()} successfully!`);
      fetchAppointments(false);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const openCancel = (patient: any) => {
    setSelectedPatient(patient);
    setCancelVisible(true);
  };

  const openReschedule = (patient: any) => {
    setSelectedPatient(patient);
    setRescheduleVisible(true);
  };

  const openApprove = (patient: any) => {
    setSelectedPatient(patient);
    setApproveVisible(true);
  };

  const openComplete = (patient: any) => {
    setSelectedPatient(patient);
    setCompleteVisible(true);
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status.toLowerCase()) {
      case 'pending': return '#FDBA31'; // Yellow/Orange
      case 'approved': return '#2CD95C'; // Green
      case 'rescheduled': return '#0D6EFD'; // Blue
      case 'cancelled': return '#FF4C4C'; // Red
      case 'completed': return '#2CD95C'; // Green
      default: return '#666';
    }
  };



  const handleOkPress = () => {
    setAppliedFromDate(fromDateInput);
    setAppliedToDate(toDateInput);
  };

  const handleClearFilter = () => {
    setFromDateInput('');
    setToDateInput('');
    setAppliedFromDate('');
    setAppliedToDate('');
  };

  const handleDownload = () => {
    if (!doctorName) {
      Alert.alert('Error', 'Doctor name not found.');
      return;
    }
    let url = `${API_URL}/export/${encodeURIComponent(doctorName)}`;
    const params = [];
    if (appliedFromDate) params.push(`from=${encodeURIComponent(appliedFromDate)}`);
    if (appliedToDate) params.push(`to=${encodeURIComponent(appliedToDate)}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    import('react-native').then(({ Linking }) => {
      Linking.openURL(url).catch(err => {
        console.error("Couldn't open download URL", err);
        Alert.alert('Error', 'Failed to start download.');
      });
    });
  };

  const onDayPress = (day: any) => {
    const [year, month, dayPart] = day.dateString.split('-');
    const formatted = `${dayPart}/${month}/${year}`;
    if (showCalendar === 'from') setFromDateInput(formatted);
    else if (showCalendar === 'to') setToDateInput(formatted);
    setShowCalendar(null);
  };



  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#052A3F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.blueTopBackground} />
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Appointment List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationIconContainer} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#0D6EFD" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.content}>

        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <View style={styles.dateInputWrapper}>
            <Text style={styles.filterLabel}>From Date:</Text>
            <View style={styles.dateInputBox}>
              <TextInput
                style={styles.dateInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#A0A0A0"
                value={fromDateInput}
                onChangeText={setFromDateInput}
              />
              <TouchableOpacity onPress={() => setShowCalendar('from')}>
                <Ionicons name="calendar-outline" size={18} color="#5C74FF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.dateInputWrapper}>
            <Text style={styles.filterLabel}>To Date:</Text>
            <View style={styles.dateInputBox}>
              <TextInput
                style={styles.dateInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#A0A0A0"
                value={toDateInput}
                onChangeText={setToDateInput}
              />
              <TouchableOpacity onPress={() => setShowCalendar('to')}>
                <Ionicons name="calendar-outline" size={18} color="#5C74FF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearFilter}>
              <Ionicons name="refresh-outline" size={18} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.okButton} onPress={handleOkPress}>
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
              <Ionicons name="download-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Modal visible={!!showCalendar} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.calendarContainer}>
              <Calendar
                onDayPress={onDayPress}
                theme={{
                  selectedDayBackgroundColor: '#0D6EFD',
                  todayTextColor: '#0D6EFD',
                  arrowColor: '#0D6EFD',
                }}
              />
              <TouchableOpacity style={styles.closeCalendarBtn} onPress={() => setShowCalendar(null)}>
                <Text style={styles.closeCalendarText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Pending' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Pending')}
          >
            <Text style={[styles.tabText, activeTab === 'Pending' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Approved' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Approved')}
          >
            <Text style={[styles.tabText, activeTab === 'Approved' && styles.activeTabText]}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Completed' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'Cancelled' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'Cancelled' && styles.activeTabText]}>Cancelled</Text>
          </TouchableOpacity>
        </View>

        {filteredAppointments.length === 0 ? (
          <Text style={styles.noData}>No {activeTab.toLowerCase()} appointments.</Text>
        ) : (
          <FlatList
            ref={flatListRef}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
              }, 500);
            }}
            data={filteredAppointments}
            keyExtractor={(item: any) => item.id || item._id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item, index }) => {
              const displayAppmtId = item.booking_id || 'Appmt0000';
              const displayPatId = item.patient_id || 'Pat0000';
              const isHighlighted = highlightedBookingId && (item.booking_id === highlightedBookingId || item.id === highlightedBookingId || item._id === highlightedBookingId);
              
              const badge = getStatusBadgeStyle(item.status);
              const avatarBg = getAvatarBg(item.status);

              const cardStyle = [
                styles.requestCard,
                isHighlighted && {
                  borderColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#FFF', '#0D6EFD']
                  }),
                  borderWidth: 2,
                  elevation: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, 10]
                  })
                }
              ];

              return (
                <TouchableOpacity activeOpacity={1} onPress={() => removeBlink(item)}>
                  <Animated.View style={cardStyle}>
                    {/* Header Row: Avatar, Name, Status */}
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.avatarContainer, !item.profileImage && { backgroundColor: avatarBg }]}>
                        <Animated.Image 
                          source={item.profileImage ? { uri: item.profileImage } : ((item.patient_gender === 'Female' || item.gender === 'Female') ? require('../assets/femalepatient.png') : require('../assets/malepatient.png'))} 
                          style={styles.avatarImage} 
                          resizeMode={item.profileImage ? "cover" : "contain"} 
                        />
                      </View>
                      
                      <View style={styles.nameAndIdCol}>
                        <Text style={styles.patientNameText}>{item.patient_name}</Text>
                        <Text style={styles.appointmentIdText}>Booking ID: {displayAppmtId}</Text>
                      </View>

                      {activeTab === 'Approved' ? (
                        <TouchableOpacity 
                          style={styles.joinVideoBtn} 
                          onPress={() => navigation.navigate('VideoCall', { 
                            patientName: item.patient_name, 
                            patientId: item.id || item._id,
                            appointmentId: item._id || item.id,
                            displayAppointmentId: displayAppmtId,
                            displayPatientId: displayPatId,
                            doctorName: doctorName,
                            loginMobile: item.login_mobile
                          })}
                        >
                          <Ionicons name="videocam" size={14} color="#FFF" />
                          <Text style={styles.joinBtnText}> Join</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                          {badge.icon && <Ionicons name={badge.icon} size={12} color={badge.text} style={{ marginRight: 4 }} />}
                          <Text style={[styles.statusPillText, { color: badge.text }]}>{item.status}</Text>
                        </View>
                      )}
                    </View>

                    {/* Details Row: Date & Time */}
                    <View style={styles.dateTimeRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailTextVal}>{item.appointment_date}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.detailTextVal}>{formatTimeSlot(item.appointment_time)}</Text>
                      </View>
                    </View>

                    {/* Department Row */}
                    <View style={styles.deptRow}>
                      <Ionicons name="medical-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailTextVal}>{item.treatment_category || 'Neurology / நரம்பியல்'}</Text>
                    </View>

                    {/* Action Buttons */}
                    {activeTab === 'Pending' && (
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22C55E' }]} onPress={() => openApprove(item)}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                          <Text style={styles.actionBtnText}> Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0D6EFD' }]} onPress={() => openReschedule(item)}>
                          <Ionicons name="calendar-outline" size={16} color="#FFF" />
                          <Text style={styles.actionBtnText}> Reschedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f27b7bff' }]} onPress={() => openCancel(item)}>
                          <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                          <Text style={styles.actionBtnText}> Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {activeTab === 'Approved' && (
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22C55E' }]} onPress={() => openComplete(item)}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#FFF" />
                          <Text style={styles.actionBtnText}> Complete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f27b7bff' }]} onPress={() => openCancel(item)}>
                          <Ionicons name="close-circle-outline" size={16} color="#FFF" />
                          <Text style={styles.actionBtnText}> Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Prescription Details for Completed */}
                    {activeTab === 'Completed' && item.prescription && item.prescription.length > 0 && (
                      <View style={styles.prescriptionBlock}>
                        <TouchableOpacity 
                          style={styles.prescriptionHeaderBtn} 
                          onPress={() => {
                            const id = item.id || item._id;
                            setExpandedPrescriptions(prev => ({
                              ...prev,
                              [id]: !prev[id]
                            }));
                          }}
                        >
                          <View style={styles.prescriptionHeaderLeft}>
                            <Ionicons name="document-text-outline" size={18} color="#1E3A8A" />
                            <Text style={styles.prescriptionTitleText}> Prescription Details</Text>
                          </View>
                          <Ionicons 
                            name={expandedPrescriptions[item.id || item._id] ? "chevron-up" : "chevron-down"} 
                            size={20} 
                            color="#1E3A8A" 
                          />
                        </TouchableOpacity>
                        
                        {expandedPrescriptions[item.id || item._id] && (
                          <View style={styles.prescriptionList}>
                            {item.prescription.map((med: any, index: number) => (
                              <View key={med.id || index.toString()} style={styles.pillRow}>
                                <View style={styles.pillIconPlaceholder}>
                                  <Ionicons name="bandage-outline" size={24} color="#6B7280" />
                                </View>
                                <View style={styles.pillInfoCol}>
                                  <View style={styles.pillNameRow}>
                                    <Text style={styles.pillNameText}>{med.name}</Text>
                                    <Text style={styles.pillQtyText}>{med.days ? `${med.days} Days` : ''}</Text>
                                  </View>
                                  <Text style={styles.pillDetailText}>Timing: {med.timing}</Text>
                                  <Text style={styles.pillDetailText}>Intake: {med.intake}</Text>
                                </View>
                              </View>
                            ))}
                            
                            <TouchableOpacity 
                              style={styles.viewFullPrescriptionBtn}
                              onPress={() => {
                                navigation.navigate('Prescription', { 
                                  patientName: item.patient_name, 
                                  patientId: item.id || item._id,
                                  appointmentId: item._id || item.id,
                                  displayAppointmentId: displayAppmtId,
                                  displayPatientId: displayPatId,
                                  existingPrescription: item.prescription
                                });
                              }}
                            >
                              <Ionicons name="document-text-outline" size={16} color="#2563EB" />
                              <Text style={styles.viewFullPrescriptionText}> View & Edit Prescription</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              )
            }}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modals */}
      <RescheduleModal
        visible={rescheduleVisible}
        onClose={() => { setRescheduleVisible(false); fetchAppointments(false); }}
        patientId={selectedPatient?.id || selectedPatient?._id}
        doctorName={doctorName}
      />
      <ApproveModal
        visible={approveVisible}
        onClose={() => setApproveVisible(false)}
        onConfirm={() => {
          setApproveVisible(false);
          handleStatusUpdate(selectedPatient?.id || selectedPatient?._id, 'Approved');
        }}
        patientName={selectedPatient?.patient_name}
      />

      <CompleteModal
        visible={completeVisible}
        onClose={() => setCompleteVisible(false)}
        onComplete={() => {
          setCompleteVisible(false);
          handleStatusUpdate(selectedPatient?.id || selectedPatient?._id, 'Completed');
        }}
        patientName={selectedPatient?.patient_name}
      />

      <CancelModal
        visible={cancelVisible}
        onClose={() => setCancelVisible(false)}
        onConfirm={() => {
          setCancelVisible(false);
          handleStatusUpdate(selectedPatient?.id || selectedPatient?._id, 'Cancelled');
        }}
        patientName={selectedPatient?.patient_name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  blueTopBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#0D6EFD',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notificationIconContainer: {
    backgroundColor: '#FFF',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  content: {
    position: 'absolute',
    top: 85,
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: '95%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInputWrapper: {
    flex: 1,
    marginRight: 8, // Reduced from 10 to give more space
  },
  filterLabel: {
    fontSize: 12, // Reduced from 12 to fit better
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 6,
    paddingHorizontal: 5, // Reduced from 8 to give text more room
    height: 32,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 11, // Reduced from 11 to fit 'DD/MM/YYYY' entirely
    color: '#333',
  },
  filterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#C4C4C4',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  okButton: {
    backgroundColor: '#5C74FF',
    borderRadius: 6,
    paddingVertical: 0,
    paddingHorizontal: 12,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  okButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  downloadButton: {
    backgroundColor: '#5C74FF',
    borderRadius: 6,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: '#0D6EFD',
  },
  tabText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeTabText: {
    color: '#0D6EFD',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 30,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  nameAndIdCol: {
    flex: 1,
    justifyContent: 'center',
  },
  patientNameText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  appointmentIdText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  joinVideoBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  joinBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailTextVal: {
    fontSize: 13,
    color: '#111827',
    marginLeft: 6,
    fontWeight: '600',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  prescriptionBlock: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  prescriptionHeaderBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  prescriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  prescriptionList: {
    marginTop: 15,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pillIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pillInfoCol: {
    flex: 1,
  },
  pillNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pillNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  pillQtyText: {
    fontSize: 12,
    color: '#4B5563',
  },
  pillDetailText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  viewFullPrescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  viewFullPrescriptionText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  }
});
