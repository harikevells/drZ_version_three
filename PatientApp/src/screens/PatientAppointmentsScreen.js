import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

import { API_BASE_URL } from '../config';

const formatTimeSlot = (timeStr) => {
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
  return `${str} to ${dHrs}.${eMinsStr}${eAmpm}`;
};

const PatientAppointmentsScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { texts } = useContext(LanguageContext);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');

  const blinkAnim = React.useRef(new Animated.Value(1)).current;
  const flatListRef = React.useRef(null);
  const [blinkingAppointments, setBlinkingAppointments] = useState([]);
  const isFocused = useIsFocused();

  const filteredAppointments = appointments.filter(app => {
    const s = (app.status || 'Pending').toLowerCase();
    if (activeTab === 'Pending') {
      return s === 'pending' || s === 'rescheduled';
    } else if (activeTab === 'Approved') {
      return s === 'approved';
    } else if (activeTab === 'Completed') {
      return s === 'completed';
    } else if (activeTab === 'Cancelled') {
      return s === 'cancelled';
    }
    return false;
  });

  useEffect(() => {
    if (!isFocused) {
      setBlinkingAppointments([]);
      blinkAnim.setValue(1);
      blinkAnim.stopAnimation();
      navigation.setParams({ blinkMessage: null });
    }
  }, [isFocused]);

  useEffect(() => {
    if ((route?.params?.blinkBookingId || route?.params?.blinkMessage) && appointments.length > 0) {
      const bookingId = route.params.blinkBookingId;
      const msg = (route.params.blinkMessage || '').toLowerCase();

      const matchedItems = appointments.map((app, index) => {
        // First try to match strictly using Booking ID if available
        if (bookingId && (app._id === bookingId || app.id === bookingId || app.booking_id === bookingId)) {
          return { index, score: 100 };
        }

        // Since Booking ID is not sent by backend, use Doctor + Date + Time as a "Virtual Booking ID"
        const docName = String(app.doctor_name || app.doctor || '').toLowerCase();
        const appDate = String(app.appointment_date || app.appointmentDate || '').toLowerCase();
        const appTime = String(app.appointment_time || app.appointmentTime || '').toLowerCase();
        const appStatus = String(app.status || '').toLowerCase();

        let score = 0;
        if (docName && msg.includes(docName)) score += 1;
        if (appDate && msg.includes(appDate)) score += 1;
        if (appTime && msg.includes(appTime)) score += 1;
        
        // Tie-breaker: Match the status! This prevents the wrong card from blinking.
        if (appStatus && msg.includes(appStatus)) score += 5;

        return { index, score };
      }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score);

      if (matchedItems.length > 0) {
        const targetIndex = matchedItems[0].index;
        const matchedApp = appointments[targetIndex];
        const matchedId = matchedApp._id || matchedApp.id;

        // Auto-switch tab to match status
        if (matchedApp && matchedApp.status) {
          const statusMap = {
            'pending': 'Pending',
            'approved': 'Approved',
            'completed': 'Completed',
            'cancelled': 'Cancelled',
            'rescheduled': 'Pending'
          };
          const correctTab = statusMap[matchedApp.status.toLowerCase()];
          if (correctTab) {
            setActiveTab(correctTab);
          }
        }

        setBlinkingAppointments([matchedId]);

        Animated.loop(
          Animated.sequence([
            Animated.timing(blinkAnim, {
              toValue: 0.3,
              duration: 500,
              useNativeDriver: true
            }),
            Animated.timing(blinkAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true
            })
          ])
        ).start();

        navigation.setParams({ blinkMessage: undefined });

        const timer = setTimeout(() => {
          setBlinkingAppointments([]);
          blinkAnim.setValue(1);
          blinkAnim.stopAnimation();
        }, 5000);

        return () => {
          clearTimeout(timer);
          blinkAnim.stopAnimation();
        };
      }
    }
  }, [route?.params?.blinkMessage, appointments]);

  useEffect(() => {
    if (blinkingAppointments.length > 0 && filteredAppointments.length > 0) {
      const targetId = blinkingAppointments[0];
      const targetIndex = filteredAppointments.findIndex(app => (app._id === targetId || app.id === targetId));
      if (targetIndex !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: targetIndex,
            animated: true,
            viewPosition: 0.5
          });
        }, 500);
      }
    }
  }, [blinkingAppointments, filteredAppointments]);

  const handleStopBlink = (item) => {
    const itemId = item._id || item.id;
    if (blinkingAppointments.includes(itemId)) {
      setBlinkingAppointments(prev => prev.filter(id => id !== itemId));
      if (blinkingAppointments.length <= 1) {
        blinkAnim.setValue(1);
        blinkAnim.stopAnimation();
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
    } else {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const mobile = user?.contactNumber || user?.mobile;
      if (!mobile) {
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/emails/patient-appointments/${mobile}`);

      if (response.data && Array.isArray(response.data)) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderAppointment = ({ item, index }) => {
    const itemId = item._id || item.id;
    const isBlinking = blinkingAppointments.includes(itemId);
    
    // Status styles
    let statusBg = '#FFF8E1'; // Pending
    let statusColor = '#F59E0B';
    let statusIcon = 'clock-outline';
    
    const statusStr = item.status || 'Pending';
    if (statusStr === 'Approved') {
      statusBg = '#E8F5E9';
      statusColor = '#16A34A';
      statusIcon = 'check-circle';
    } else if (statusStr === 'Rescheduled') {
      statusBg = '#E3F2FD';
      statusColor = '#2563EB';
      statusIcon = 'calendar-clock';
    } else if (statusStr === 'Cancelled') {
      statusBg = '#FEE2E2';
      statusColor = '#DC2626';
      statusIcon = 'close-circle';
    } else if (statusStr === 'Completed') {
      statusBg = '#F3E8FF';
      statusColor = '#7C3AED';
      statusIcon = 'check-all';
    }
    
    return (
      <TouchableOpacity activeOpacity={1} onPress={() => handleStopBlink(item)}>
        <Animated.View style={[styles.card, isBlinking && { borderColor: '#5F76FE', borderWidth: 2 }]}>
          
          <View style={styles.cardTop}>
            <View style={styles.doctorInfo}>
              <Image source={require('../assets/doctorlogo.png')} style={styles.doctorImg} />
              <View>
                <Text style={styles.doctorName}>{item.doctor_name || item.doctor || 'Doctor'}</Text>
                <Text style={styles.doctorSpec}>Consultant</Text>
              </View>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Icon name={statusIcon} size={14} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>{item.status || "Pending"}</Text>
            </View>
          </View>

          <View style={[styles.dateTimeBox, { backgroundColor: statusBg }]}>
            <View style={styles.dateSection}>
              <View style={styles.iconBox}>
                <Icon name="calendar-month-outline" size={20} color={statusColor} />
              </View>
              <View>
                <Text style={styles.dtValue}>{item.appointment_date || item.appointmentDate}</Text>
                <Text style={styles.dtLabel}>Date</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.timeSection}>
              <View style={styles.iconBox}>
                <Icon name="clock-outline" size={20} color={statusColor} />
              </View>
              <View>
                <Text style={styles.dtValue}>{formatTimeSlot(item.appointment_time || item.appointmentTime)}</Text>
                <Text style={styles.dtLabel}>Time</Text>
              </View>
            </View>
          </View>

          <View style={{borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15}}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: '#FF9F43' }]}>
                <Icon name="account-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.infoLabel}>Patient Name</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{item.patient_name || item.patientName || 'Patient'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: '#0984e3' }]}>
                <Icon name="identifier" size={16} color="#fff" />
              </View>
              <Text style={styles.infoLabel}>Booking ID</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{item.booking_id || 'Appmt0000'}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: '#6C5CE7' }]}>
                <Icon name="view-grid-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{item.treatment_category || 'N/A'}</Text>
            </View>

            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <View style={[styles.infoIconBox, { backgroundColor: '#FF7675' }]}>
                <Icon name="video-outline" size={16} color="#fff" />
              </View>
              <Text style={styles.infoLabel}>Video Call</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{item.video_call || 'No'}</Text>
            </View>
          </View>
          
          {String(item.video_call).toLowerCase() === 'yes' && (
            <TouchableOpacity 
              style={[styles.videoCallButton, (statusStr.toLowerCase() === 'completed' || statusStr.toLowerCase() === 'pending') && { backgroundColor: '#ccc' }]} 
              disabled={statusStr.toLowerCase() === 'completed' || statusStr.toLowerCase() === 'pending'}
              onPress={() => {
                navigation.navigate('VideoCall', {
                  bookingId: item._id || item.id,
                  roomId: `drz_${item._id || item.id}`,
                  doctorName: item.doctor_name || item.doctor || 'Doctor',
                  patientName: item.patient_name || 'Patient',
                  patientMobile: item.login_mobile,
                  isPatientInitiated: true
                });
              }}
            >
              <Icon name="video" size={24} color="#fff" />
            </TouchableOpacity>
          )}

        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerActionLeft}>
          <TouchableOpacity onPress={() => navigation && navigation.goBack()} style={styles.backArrowBtn}>
            <Icon name="arrow-left" size={24} color="#1C3E55" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>My Appointments / எனது முன்பதிவுகள்</Text>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#5F76FE" style={{ marginTop: 50 }} />
        ) : (
          <>
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

            {filteredAppointments.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={filteredAppointments}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderAppointment}
                contentContainerStyle={{ paddingBottom: 10 }}
                showsVerticalScrollIndicator={false}
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
                  });
                }}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="calendar-remove" size={80} color="#ccc" />
                <Text style={styles.emptyText}>No {activeTab.toLowerCase()} appointments / முன்பதிவுகள் இல்லை</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backArrowBtn: {
    padding: 4,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3E55',
  },

  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 70 },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: '#5F76FE',
  },
  tabText: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
    color: '#5F76FE',
  },

  card: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  doctorInfo: { flexDirection: 'row', alignItems: 'center' },
  doctorImg: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E3E9FF', marginRight: 15 },
  doctorName: { fontSize: 16, fontWeight: 'bold', color: '#1C3E55' },
  doctorSpec: { fontSize: 13, color: '#888', marginTop: 2 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },

  dateTimeBox: { flexDirection: 'row', borderRadius: 12, padding: 15, marginBottom: 14, alignItems: 'center' },
  dateSection: { flex: 0.85, flexDirection: 'row', alignItems: 'center' },
  divider: { width: 1, height: 35, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  timeSection: { flex: 1.10, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 1, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2 },
  dtValue: { fontSize: 13, fontWeight: 'bold', color: '#1C3E55' },
  dtLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoLabel: { fontSize: 13, color: '#555', width: 95 },
  infoColon: { fontSize: 13, color: '#555', marginRight: 15 },
  infoValue: { fontSize: 13, color: '#1C3E55', flex: 1, fontWeight: '600' },
  
  videoCallButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF7675',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
    fontWeight: '500'
  }
});

export default PatientAppointmentsScreen;
