import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import { useIsFocused, useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppointmentsListScreen = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();
  const route = useRoute();
  const navigation = useNavigation();
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useContext(AuthContext);

  const fetchAppointments = async () => {
    try {
      const IP_ADDRESS = '10.10.11.90';
      const BASE_URL = `http://${IP_ADDRESS}:5000`;
      const mobile = user.contactNumber || user.mobile;
      
      const response = await axios.get(`${BASE_URL}/api/emails/patient-appointments/${mobile}`);
      setAppointments(response.data);
    } catch (error) {
      console.log('Error fetching appointments or camps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && user) {
      fetchAppointments();
      const fetchUnreadCount = async () => {
        try {
          const IP_ADDRESS = '10.10.11.90';
          const BASE_URL = `http://${IP_ADDRESS}:5000`;
          const mobile = user.contactNumber || user.mobile;
          const response = await axios.get(`${BASE_URL}/api/notifications/patient/${mobile}`);
          const unread = response.data.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        } catch (error) {
          console.log("Error fetching notifications count", error);
        }
      };
      fetchUnreadCount();
    }
  }, [isFocused, user]);

  useEffect(() => {
    if (route.params?.highlightedMessage) {
      setHighlightedMessage(route.params.highlightedMessage);
      navigation.setParams({ highlightedMessage: null });
    } else {
      AsyncStorage.getItem('highlightedPatientMessage').then(msg => {
        if (msg) {
          setHighlightedMessage(msg);
          AsyncStorage.removeItem('highlightedPatientMessage');
        }
      });
    }
  }, [route.params?.highlightedMessage]);

  const getStatusColor = (status) => {
    if (!status) return '#FFA500'; // Default pending
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'approved': return '#2CA01C';
      case 'rescheduled': return '#0084FF';
      case 'cancelled': 
      case 'canceled': return '#FF4C4C';
      case 'completed': return '#052A3F';
      default: return '#FFA500';
    }
  };

  const getTimelineText = (item) => {
    const s = item.status || '';
    if (s.toLowerCase() === 'approved') return 'Approved: ';
    if (s.toLowerCase() === 'rescheduled') return 'Rescheduled: ';
    if (s.toLowerCase() === 'completed') return 'Completed: ';
    if (s.toLowerCase() === 'cancelled' || s.toLowerCase() === 'canceled') return 'Cancelled: ';
    if (item.isRescheduled) return 'Rescheduled: ';
    return 'Updated: ';
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate().toString().padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    
    return `${day} ${month} ${year} at ${hours}:${minutes} ${ampm}`;
  };

  const getMatchedAppointmentId = () => {
    if (!highlightedMessage || !appointments.length) return null;
    const hMsg = highlightedMessage.toLowerCase().replace(/\s+/g, '');
    
    // 1. Try Date + Time
    for (const appt of appointments) {
      const dDate = (appt.appointment_date || '').toLowerCase().replace(/\s+/g, '');
      const dTime = (appt.appointment_time || '').toLowerCase().replace(/\s+/g, '');
      if (dDate && dTime && hMsg.includes(dDate) && hMsg.includes(dTime)) {
        return appt._id || appt.id;
      }
    }

    // 2. Try Date + Doctor
    for (const appt of appointments) {
      const dDate = (appt.appointment_date || '').toLowerCase().replace(/\s+/g, '');
      const dName = (appt.doctor_name || '').toLowerCase().replace(/\s+/g, '');
      if (dDate && dName && hMsg.includes(dDate) && hMsg.includes(dName)) {
        return appt._id || appt.id;
      }
    }

    // 3. Fallback: Just Doctor Name (highlights only the most recent one since list is sorted by date)
    for (const appt of appointments) {
      const dName = (appt.doctor_name || '').toLowerCase().replace(/\s+/g, '');
      if (dName && hMsg.includes(dName)) {
        return appt._id || appt.id;
      }
    }
    
    return null;
  };

  // Sort the appointments so that the highlighted one appears at the top
  const getSortedAppointments = () => {
    const matchedId = getMatchedAppointmentId();
    if (!matchedId) return appointments;

    return [...appointments].sort((a, b) => {
      const aId = a._id || a.id;
      const bId = b._id || b.id;
      
      if (aId === matchedId && bId !== matchedId) return -1;
      if (aId !== matchedId && bId === matchedId) return 1;
      return 0; // maintain original order for others
    });
  };

  const renderItem = ({ item }) => {
    const matchedId = getMatchedAppointmentId();
    const itemId = item._id || item.id;
    const isHighlighted = matchedId && (matchedId === itemId);

    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => {
          if (isHighlighted) {
            setHighlightedMessage(null);
            navigation.setParams({ highlightedMessage: null });
          }
        }}
        style={[styles.card, isHighlighted && { backgroundColor: '#E6F4FE', borderColor: '#0084FF', borderWidth: 1 }]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.doctorIconContainer}>
              <Icon name="doctor" size={24} color="#5465FF" />
            </View>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.doctorName}>Dr. {item.doctor_name}</Text>
              <Text style={styles.category} numberOfLines={1}>{item.treatment_category}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status || 'Pending'}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="calendar-blank-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{item.appointment_date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={20} color="#666" />
            <Text style={styles.infoText}>{item.appointment_time}</Text>
          </View>
          
          <View style={styles.patientRow}>
            <Icon name="account-outline" size={20} color="#666" />
            <Text style={styles.infoText}>Patient: {item.patient_name} ({item.patient_age} yrs, {item.patient_gender})</Text>
          </View>

          {item.video_call === 'Yes' && (
            <View style={[styles.infoRow, { marginTop: 5 }]}>
              <Icon name="video-outline" size={20} color="#5465FF" />
              <Text style={[styles.infoText, { color: '#5465FF', fontWeight: 'bold' }]}>Video Call Consultation</Text>
            </View>
          )}

          {/* Timeline Details */}
          <View style={styles.timelineBox}>
            <View style={styles.timelineRow}>
              <Icon name="clock-fast" size={14} color="#888" />
              <Text style={styles.timelineText}>
                Requested: {item.createdAt ? formatTimestamp(item.createdAt) : '--'}
              </Text>
            </View>
            
            <View style={styles.timelineRow}>
              <Icon name="check-circle" size={14} color={item.approvedAt || item.status?.toLowerCase() === 'approved' || item.status?.toLowerCase() === 'completed' ? "#2CA01C" : "#CCC"} />
              <Text style={[styles.timelineText, (item.approvedAt || item.status?.toLowerCase() === 'approved' || item.status?.toLowerCase() === 'completed') ? { color: '#2CA01C', fontWeight: 'bold' } : {}]}>
                Approved: {(item.approvedAt || item.status?.toLowerCase() === 'approved' || item.status?.toLowerCase() === 'completed') ? `${item.appointment_date} | ${item.appointment_time}` : '--'}
              </Text>
            </View>

            <View style={styles.timelineRow}>
              <Icon name="calendar-sync" size={14} color={item.rescheduledAt || item.status?.toLowerCase() === 'rescheduled' || item.isRescheduled ? "#0084FF" : "#CCC"} />
              <Text style={[styles.timelineText, (item.rescheduledAt || item.status?.toLowerCase() === 'rescheduled' || item.isRescheduled) ? { color: '#0084FF', fontWeight: 'bold' } : {}]}>
                Rescheduled: {(item.rescheduledAt || item.status?.toLowerCase() === 'rescheduled' || item.isRescheduled) ? `${item.appointment_date} | ${item.appointment_time}` : '--'}
              </Text>
            </View>

            <View style={styles.timelineRow}>
              <Icon name="flag-checkered" size={14} color={item.completedAt || item.status?.toLowerCase() === 'completed' ? "#052A3F" : "#CCC"} />
              <Text style={[styles.timelineText, (item.completedAt || item.status?.toLowerCase() === 'completed') ? { color: '#052A3F', fontWeight: 'bold' } : {}]}>
                Completed: {(item.completedAt || item.status?.toLowerCase() === 'completed') ? `${item.appointment_date} | ${item.appointment_time}` : '--'}
              </Text>
            </View>

            {(item.cancelledAt || item.status?.toLowerCase() === 'cancelled' || item.status?.toLowerCase() === 'canceled') && (
              <View style={styles.timelineRow}>
                <Icon name="cancel" size={14} color="#FF4C4C" />
                <Text style={[styles.timelineText, { color: '#FF4C4C', fontWeight: 'bold' }]}>
                  Cancelled: {item.cancelledAt ? formatTimestamp(item.cancelledAt) : formatTimestamp(item.updatedAt || item.createdAt)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={[styles.userInfo, { backgroundColor: '#F0F0F0', padding: 5, paddingRight: 15, borderRadius: 25 }]}>
          <Image source={require('../assets/logo.png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#FFF' }} resizeMode="contain" />
          <View style={styles.textContainer}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111' }}>Welcome To DrZ</Text>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 0 }]} onPress={() => navigation.navigate('NotificationPatient')}>
            <Icon name="bell-outline" size={24} color="#6276F5" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 0, marginLeft: 5 }]} onPress={handleLogoutPress}>
            <Icon name="logout" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 15, paddingTop: 10 }}>
        <Text style={styles.title}>My Appointments</Text>
        <Text style={styles.subtitle}>அப்பாயிண்ட்மெண்ட்ஸ்</Text>
      </View>

      <View style={styles.container}>
        
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5465FF" />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Icon name="calendar-remove" size={60} color="#CCC" />
          <Text style={styles.noDataText}>No appointments found.</Text>
        </View>
      ) : (
        <FlatList
          data={getSortedAppointments()}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>

      {/* CUSTOM LOGOUT MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Icon name="logout" size={40} color="#E74C3C" style={{ marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Logout / வெளியேறு</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout? / நீங்கள் வெளியேற விரும்புகிறீர்களா?</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel / ரத்து</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                <Text style={styles.confirmButtonText}>Confirm / உறுதி</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.005,
    marginBottom: 10
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { justifyContent: 'center' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 2, position: 'relative' },
  badge: { position: 'absolute', right: 2, top: 2, backgroundColor: '#E74C3C', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6E9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  category: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    fontWeight: '500',
  },
  timelineBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 6,
  },
  // Logout Modal
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  logoutModalContent: { width: '88%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButtonRow: { flexDirection: 'row', width: '100%', gap: 10 },
  cancelButton: {
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    padding: 12,
    backgroundColor: '#FF4C4C',
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default AppointmentsListScreen;
