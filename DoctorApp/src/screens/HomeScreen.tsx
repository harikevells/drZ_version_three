import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CancelModal from '../components/CancelModal';

const API_URL = 'http://10.10.11.90:5000/api/appointments';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  
  const [stats, setStats] = useState({ todaysAppointments: 0, pendingAppointments: 0, totalAttended: 0 });
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
    setSelectedPatient(patient);
    setRescheduleVisible(true);
  };

  const openApprove = (patient: any) => {
    setSelectedPatient(patient);
    setApproveVisible(true);
  };

  const openCancel = (patient: any) => {
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
      <Header />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Appointments Summary */}
        <Text style={styles.sectionTitle}>Appointments</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.todaysAppointments < 10 ? `0${stats.todaysAppointments}` : stats.todaysAppointments}</Text>
            <Text style={styles.statLabel}>Today's{'\n'}Appointment</Text>
            <Ionicons name="calendar-outline" size={24} color="#2CA01C" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingAppointments < 10 ? `0${stats.pendingAppointments}` : stats.pendingAppointments}</Text>
            <Text style={styles.statLabel}>Pending{'\n'}Appointment</Text>
            <Ionicons name="time-outline" size={24} color="#FFA500" style={styles.statIcon} />
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
          patientRequests.map((patient: any) => (
            <View key={patient.id || patient._id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>{patient.patient_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
                  <Text style={styles.statusText}>{patient.status}</Text>
                </View>
              </View>
              <Text style={styles.dateTime}>{patient.appointment_date} {patient.appointment_time}</Text>
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
            </View>
          ))
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
                <View style={styles.cardBase}>
                  <Image 
                    source={item.patient_gender === 'Female' ? require('../assets/femalepatient.png') : require('../assets/malepatient.png')} 
                    style={styles.patientImage}
                  />
                  <View style={styles.recentNameBadge}>
                    <Text style={styles.recentName}>{item.patient_name}</Text>
                  </View>
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
    paddingBottom: 5,
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
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
    minHeight: 110,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#052A3F',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 15,
    color: '#666',
  },
  statIcon: {
    position: 'absolute',
    top: 25,
    right: 20,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  approveBtn: {
    backgroundColor: '#2CA01C',
  },
  rescheduleBtn: {
    backgroundColor: '#0084FF',
  },
  cancelBtn: {
    backgroundColor: '#E0E0E0',
  },
  btnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  btnTextDark: {
    color: '#666',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recentList: {
    paddingTop: 85,
    paddingBottom: 5,
    paddingLeft: 5,
  },
  recentPatientCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 140,
  },
  cardBase: {
    width: 140,
    height: 70,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  patientImage: {
    width: 120,
    height: 140,
    resizeMode: 'contain',
    position: 'absolute',
    bottom: 25,
    zIndex: 1,
  },
  recentNameBadge: {
    backgroundColor: '#E83F5B',
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  recentName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
