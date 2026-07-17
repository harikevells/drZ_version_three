import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CancelModal from '../components/CancelModal';

const API_URL = 'http://10.10.11.90:5000/api/appointments';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [highlightedPatientName, setHighlightedPatientName] = useState<string | null>(null);
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  
  const [stats, setStats] = useState({ todaysAppointments: 0, pendingAppointments: 0, totalAttended: 0, rescheduledAppointments: 0 });
  const [patientRequests, setPatientRequests] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        const response = await axios.get(`${API_URL}/dashboard/${user.doctorName}`);
        setStats(response.data.stats);
        setPatientRequests(response.data.patientRequests);
        setRecentPatients(response.data.recentPatients);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (route.params?.highlightedPatientName) {
      setHighlightedPatientName(route.params.highlightedPatientName);
      // Clear route param so it doesn't stick forever when returning to this tab
      navigation.setParams({ highlightedPatientName: null });
    } else {
      AsyncStorage.getItem('highlightedPatientName').then(name => {
        if (name) {
          setHighlightedPatientName(name);
          AsyncStorage.removeItem('highlightedPatientName');
        }
      });
    }
  }, [route.params?.highlightedPatientName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      Alert.alert('Success', `Appointment ${status.toLowerCase()} successfully!`);
      fetchDashboardData(); // Refresh list after update
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const openReschedule = (patient: any) => {
    setHighlightedPatientName(null);
    setSelectedPatient(patient);
    setRescheduleVisible(true);
  };

  const openApprove = (patient: any) => {
    setHighlightedPatientName(null);
    setSelectedPatient(patient);
    setApproveVisible(true);
  };

  const openCancel = (patient: any) => {
    setHighlightedPatientName(null);
    setSelectedPatient(patient);
    setCancelVisible(true);
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    switch (status.toLowerCase()) {
      case 'pending': return '#FFA500';
      case 'approved': return '#2CA01C';
      case 'rescheduled': return '#0084FF';
      case 'cancelled': return '#FF4C4C';
      case 'completed': return '#052A3F';
      default: return '#666';
    }
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
      <Header isBlueTheme={false} />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Appointments Summary */}
        <Text style={styles.sectionTitle}>Appointments</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCardBlue, { marginRight: 10 }]}>
            <Text style={styles.statNumberWhite}>{stats.todaysAppointments < 10 ? `0${stats.todaysAppointments}` : stats.todaysAppointments}</Text>
            <Text style={styles.statLabelWhite}>Today's{'\n'}Appointment</Text>
          </View>
          <View style={[styles.statCardBlue, { marginRight: 10 }]}>
            <Text style={styles.statNumberWhite}>{stats.pendingAppointments < 10 ? `0${stats.pendingAppointments}` : stats.pendingAppointments}</Text>
            <Text style={styles.statLabelWhite}>Pending{'\n'}Appointment</Text>
          </View>
          <View style={styles.statCardBlue}>
            <Text style={styles.statNumberWhite}>{stats.rescheduledAppointments < 10 ? `0${stats.rescheduledAppointments}` : stats.rescheduledAppointments}</Text>
            <Text style={styles.statLabelWhite}>Reschedule{'\n'}Appointment</Text>
          </View>
        </View>

        {/* Patient Request */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Request</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointment')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {patientRequests.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No pending requests.</Text>
        ) : (
          patientRequests.map((patient: any) => {
            const isHighlighted = highlightedPatientName && patient.patient_name && patient.patient_name.trim().toLowerCase() === highlightedPatientName.trim().toLowerCase();
            return (
            <TouchableOpacity 
              key={patient.id || patient._id} 
              activeOpacity={0.9}
              onPress={() => {
                if (isHighlighted) {
                  setHighlightedPatientName(null);
                  navigation.setParams({ highlightedPatientName: null });
                }
              }}
              style={[styles.requestCard, isHighlighted && { backgroundColor: '#E6F4FE', borderColor: '#0084FF', borderWidth: 1 }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>{patient.patient_name}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(patient.status) }]}>{patient.status}</Text>
              </View>
              <Text style={styles.dateTime}>{patient.appointment_date} {patient.appointment_time ? patient.appointment_time.replace(' to ', ' - ') : ''}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => openApprove(patient)}
                >
                  <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.rescheduleBtn]}
                  onPress={() => openReschedule(patient)}
                >
                  <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => openCancel(patient)}
                >
                  <Text style={styles.btnTextDark} numberOfLines={1} adjustsFontSizeToFit>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            );
          })
        )}

        {/* Recent Patient History */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Recent Patient History</Text>
        {recentPatients.length === 0 ? (
           <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No recent history.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recentPatients}
            keyExtractor={(item: any) => item.id || item._id}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.recentPatientCard}>
                <Image 
                  source={item.patient_gender === 'Female' ? require('../assets/femalepatient.png') : require('../assets/malepatient.png')} 
                  style={styles.recentPatientImage}
                />
                <Text style={styles.recentName}>{item.patient_name}</Text>
                <Text style={styles.recentCategory}>{item.treatment_category || 'General Checkup'}</Text>
                <View style={styles.recentDateBadge}>
                  <Ionicons name="calendar-outline" size={10} color="#0066FF" />
                  <Text style={styles.recentDateText}>30 Mar 2026</Text>
                </View>
              </View>
            )}
            contentContainerStyle={styles.recentList}
          />
        )}
        
      </ScrollView>

      {/* Modals */}
      <RescheduleModal 
        visible={rescheduleVisible} 
        onClose={() => { setRescheduleVisible(false); fetchDashboardData(); }} 
        patientId={selectedPatient?.id || selectedPatient?._id}
        doctorName={doctorName}
        currentDate={selectedPatient?.appointment_date}
        currentTime={selectedPatient?.appointment_time}
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
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110, // Added space so content isn't hidden behind the floating footer
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  viewAll: {
    fontSize: 12,
    color: '#052A3F',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  statCardBlue: {
    flex: 1,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statNumberWhite: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  statLabelWhite: {
    fontSize: 12,
    color: '#FFF',
    lineHeight: 16,
  },
  requestCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    marginTop: 5,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  approveBtn: {
    backgroundColor: '#2CA01C',
  },
  rescheduleBtn: {
    backgroundColor: '#FFA500', // Yellow/Orange
  },
  cancelBtn: {
    backgroundColor: '#E0E0E0',
  },
  btnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  btnTextDark: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recentList: {
    paddingBottom: 20,
    paddingLeft: 5,
  },
  recentPatientCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginRight: 15,
    width: 130,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  recentPatientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  recentName: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  recentCategory: {
    color: '#888',
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  recentDateBadge: {
    flexDirection: 'row',
    backgroundColor: '#E6F4FE',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentDateText: {
    color: '#0066FF',
    fontSize: 9,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
