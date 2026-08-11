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
      case 'pending': return '#F59E0B';
      case 'approved': return '#10B981';
      case 'rescheduled': return '#0D6EFD';
      case 'cancelled': return '#EF4444';
      case 'completed': return '#8B5CF6';
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
        <View style={styles.statsContainer}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#EAF1FE' }]} onPress={() => navigation.navigate('Appointment', { activeTab: 'Pending' })}>
            <View style={[styles.iconWrapper, { backgroundColor: '#4871F7' }]}>
              <Ionicons name="calendar-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.statNumberText}>{stats.todaysAppointments < 10 ? `0${stats.todaysAppointments}` : stats.todaysAppointments}</Text>
            <Text style={styles.statLabelText}>Today's{'\n'}Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#E6F8F3' }]} onPress={() => navigation.navigate('Appointment', { activeTab: 'Pending' })}>
            <View style={[styles.iconWrapper, { backgroundColor: '#20C997' }]}>
              <Ionicons name="hourglass-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.statNumberText}>{stats.pendingAppointments < 10 ? `0${stats.pendingAppointments}` : stats.pendingAppointments}</Text>
            <Text style={styles.statLabelText}>Pending{'\n'}Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.statCard, { backgroundColor: '#EAF1FE' }]} onPress={() => navigation.navigate('Appointment', { activeTab: 'Pending' })}>
            <View style={[styles.iconWrapper, { backgroundColor: '#0D6EFD' }]}>
              <Ionicons name="time-outline" size={16} color="#FFF" />
            </View>
            <Text style={styles.statNumberText}>{stats.rescheduleAppointments < 10 ? `0${stats.rescheduleAppointments}` : stats.rescheduleAppointments}</Text>
            <Text style={styles.statLabelText}>Rescheduled{'\n'}Appointments</Text>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointment')}>
            <Text style={styles.viewAll}>See All <Ionicons name="arrow-forward" size={12} color="#4A4A4A" /></Text>
          </TouchableOpacity>
        </View>

        {patientRequests.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No upcoming appointments.</Text>
        ) : (
          patientRequests.slice(0, 3).map((patient: any) => (
            <View key={patient.id || patient._id} style={styles.requestCard}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={patient.profileImage ? { uri: patient.profileImage } : ((patient.patient_gender === 'Female' || patient.gender === 'Female') ? require('../assets/femalepatient.png') : require('../assets/malepatient.png'))} 
                    style={styles.avatarImage} 
                    resizeMode={patient.profileImage ? "cover" : "contain"} 
                  />
                </View>
                <View style={styles.nameAndStatus}>
                  <View style={styles.nameRow}>
                    <Text style={styles.patientName}>{patient.patient_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(patient.status) }]}>{patient.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.dateTimeText}>{patient.appointment_date}  •  {formatTimeSlot(patient.appointment_time)}</Text>
                  <View style={styles.categoryRow}>
                    <Ionicons name="medkit-outline" size={12} color="#666" />
                    <Text style={styles.categoryText}>{patient.treatment_category || 'General Consultation'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => openApprove(patient)}>
                  <Ionicons name="checkmark" size={16} color="#FFF" style={{marginRight: 4}}/>
                  <Text style={styles.btnTextAction}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.rescheduleBtn]} onPress={() => openReschedule(patient)}>
                  <Ionicons name="calendar-outline" size={14} color="#FFF" style={{marginRight: 4}}/>
                  <Text style={styles.btnTextAction}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => openCancel(patient)}>
                  <Ionicons name="close" size={16} color="#FFF" style={{marginRight: 4}}/>
                  <Text style={styles.btnTextAction}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIconBg, { backgroundColor: '#F0F5FF' }]}>
              <Ionicons name="calendar-outline" size={24} color="#4871F7" />
            </View>
            <Text style={styles.quickActionText}>Add{'\n'}Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIconBg, { backgroundColor: '#F5F0FF' }]}>
              <Ionicons name="people-outline" size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.quickActionText}>Patient{'\n'}History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIconBg, { backgroundColor: '#EAF6FF' }]}>
              <Ionicons name="document-text-outline" size={24} color="#0D6EFD" />
            </View>
            <Text style={styles.quickActionText}>Create{'\n'}Prescription</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIconBg, { backgroundColor: '#FFF5EB' }]}>
              <Ionicons name="bar-chart-outline" size={24} color="#FD7E14" />
            </View>
            <Text style={styles.quickActionText}>Reports</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Patient History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Patient History</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>See All <Ionicons name="arrow-forward" size={12} color="#4A4A4A" /></Text>
          </TouchableOpacity>
        </View>

        {recentPatients.length === 0 ? (
           <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20 }}>No recent history.</Text>
        ) : (
          recentPatients.slice(0, 3).map((item: any) => (
            <View key={item.id || item._id} style={styles.recentHistoryCard}>
              <View style={styles.recentAvatarContainer}>
                <Image 
                  source={item.profileImage ? { uri: item.profileImage } : ((item.patient_gender === 'Female' || item.gender === 'Female') ? require('../assets/femalepatient.png') : require('../assets/malepatient.png'))} 
                  style={styles.recentAvatarImage} 
                  resizeMode={item.profileImage ? "cover" : "contain"} 
                />
              </View>
              <View style={styles.historyDetails}>
                <Text style={styles.historyName}>{item.patient_name}</Text>
                <Text style={styles.historyDate}>{item.appointment_date || '04/08/2026'} • {formatTimeSlot(item.appointment_time) || '11:30 AM'}</Text>
                <View style={styles.historyCategoryRow}>
                  <Ionicons name="medkit-outline" size={12} color="#666" />
                  <Text style={styles.historyCategoryText}>{item.treatment_category || 'Fever, Headache'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="arrow-forward" size={12} color="#333" />
              </TouchableOpacity>
            </View>
          ))
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
    backgroundColor: '#FAFCFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    width: '31.5%',
    minHeight: 110,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabelText: {
    fontSize: 15,
    color: '#555',
    fontWeight: '600',
    lineHeight: 20,
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
    color: '#0F172A',
  },
  viewAll: {
    fontSize: 13,
    color: '#4A4A4A',
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EBF4FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
  },
  nameAndStatus: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateTimeText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  approveBtn: {
    backgroundColor: '#22C55E',
  },
  rescheduleBtn: {
    backgroundColor: '#0D6EFD',
  },
  cancelBtn: {
    backgroundColor: '#f27b7bff',
  },
  btnTextAction: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickActionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 5,
    width: '23%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickActionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  recentHistoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  recentAvatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EBF4FF',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  recentAvatarImage: {
    width: 40,
    height: 40,
  },
  historyDetails: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  historyCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCategoryText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 4,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    marginRight: 4,
  },
});
