import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CancelModal from '../components/CancelModal';

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
  return `${str} to ${dHrs}.${eMinsStr}${eAmpm}`;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  
  const [stats, setStats] = useState({ todaysAppointments: 0, pendingAppointments: 0, rescheduleAppointments: 0, totalAttended: 0 });
  const [patientRequests, setPatientRequests] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        const response = await axios.get(`${API_URL}/dashboard/${user.doctorName}`);
        
        const data = response.data;
        const pendingCount = data.patientRequests.filter((req: any) => req.status.toLowerCase() === 'pending').length;
        const rescheduledCount = data.patientRequests.filter((req: any) => req.status.toLowerCase() === 'rescheduled').length;

        setStats({
          todaysAppointments: data.stats.todaysAppointments || 0,
          pendingAppointments: pendingCount,
          rescheduleAppointments: rescheduledCount,
          totalAttended: data.stats.totalAttended || 0
        });
        setPatientRequests(data.patientRequests);
        setRecentPatients(data.recentPatients);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchDashboardData();
    }
  }, [isFocused]);

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
        <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>Appointments</Text>
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCardBlue} onPress={() => navigation.navigate('Appointment', { activeTab: 'Pending' })}>
            <Text style={styles.statNumberWhite}>{stats.todaysAppointments < 10 ? `0${stats.todaysAppointments}` : stats.todaysAppointments}</Text>
            <Text style={styles.statLabelWhite}>Today's{'\n'}Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCardBlue} onPress={() => navigation.navigate('Appointment', { activeTab: 'Pending' })}>
            <Text style={styles.statNumberWhite}>{stats.pendingAppointments < 10 ? `0${stats.pendingAppointments}` : stats.pendingAppointments}</Text>
            <Text style={styles.statLabelWhite}>Pending{'\n'}Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCardBlue} onPress={() => navigation.navigate('Appointment', { activeTab: 'Pending' })}>
            <Text style={styles.statNumberWhite}>{stats.rescheduleAppointments < 10 ? `0${stats.rescheduleAppointments}` : stats.rescheduleAppointments}</Text>
            <Text style={styles.statLabelWhite}>Reschedule{'\n'}Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Request */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointment')}>
            <Text style={styles.viewAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {patientRequests.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No pending requests.</Text>
        ) : (
          patientRequests.slice(0, 3).map((patient: any) => (
            <View key={patient.id || patient._id} style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.patientName}>{patient.patient_name}</Text>
                <Text style={[styles.statusTextInline, { color: getStatusColor(patient.status) }]}>{patient.status}</Text>
              </View>
              <Text style={styles.dateTime}>{patient.appointment_date} {formatTimeSlot(patient.appointment_time)}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.btn, styles.approveBtn]}
                  onPress={() => openApprove(patient)}
                >
                  <Text style={styles.btnTextAction}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.rescheduleBtn]}
                  onPress={() => openReschedule(patient)}
                >
                  <Text style={styles.btnTextAction}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => openCancel(patient)}
                >
                  <Text style={styles.btnTextAction}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Recent Patient History */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionTitle}>Recent Patient History</Text>
        </View>
        {recentPatients.length === 0 ? (
           <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No recent history.</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recentPatients}
            keyExtractor={(item: any) => item.id || item._id}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.historyCard}>
                <View style={styles.historyImageContainer}>
                  <Image 
                    source={item.patient_gender === 'Female' ? require('../assets/femalepatient.png') : require('../assets/malepatient.png')} 
                    style={styles.historyPatientImage}
                  />
                </View>
                <Text style={styles.historyPatientName} numberOfLines={1}>{item.patient_name}</Text>
                <Text style={styles.historySubText} numberOfLines={1}>{item.treatment_category || 'General Checkup'}</Text>
                <View style={styles.historyDatePill}>
                  <Ionicons name="calendar-outline" size={12} color="#0084FF" />
                  <Text style={styles.historyDateText}>
                    {item.appointment_date ? item.appointment_date : '28 Mar 2026'}
                  </Text>
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
    backgroundColor: '#f5f7feff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAll: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCardBlue: {
    backgroundColor: '#0D6EFD',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    width: '32%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 110,
    justifyContent: 'center',
  },
  statNumberWhite: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  statLabelWhite: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: 'bold',
    lineHeight: 16,
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statusTextInline: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateTime: {
    fontSize: 13,
    color: '#555',
    marginBottom: 15,
    marginTop: 5,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  approveBtn: {
    backgroundColor: '#2DC045',
  },
  rescheduleBtn: {
    backgroundColor: '#FFB84D',
  },
  cancelBtn: {
    backgroundColor: '#F47171',
  },
  btnTextAction: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  recentList: {
    paddingTop: 10,
    paddingBottom: 5,
    paddingLeft: 5,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  historyImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 35,
    backgroundColor: '#EBF4FF',
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  historyPatientImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  historyPatientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  historySubText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  historyDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  historyDateText: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '600',
    marginLeft: 4,
  },
});
