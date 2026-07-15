import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CompleteModal from '../components/CompleteModal';
import CancelModal from '../components/CancelModal';

const API_URL = 'http://10.10.11.90:5000/api/appointments';

export default function AppointmentScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Completed' | 'Cancelled'>('Pending');
  const [doctorName, setDoctorName] = useState('');

  // Modal states
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const fetchAppointments = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
        const response = await axios.get(`${API_URL}/all/${encodeURIComponent(user.doctorName)}`);
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      Alert.alert('Success', `Appointment ${status.toLowerCase()} successfully!`);
      fetchAppointments();
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
      case 'pending': return '#FFA500';
      case 'approved': return '#2CA01C';
      case 'rescheduled': return '#0084FF';
      case 'cancelled': return '#FF4C4C';
      case 'completed': return '#2CA01C';
      default: return '#666';
    }
  };

  const filteredAppointments = appointments.filter(app => {
    if (!app.status) return false;
    const s = app.status.toLowerCase();
    if (activeTab === 'Pending') {
      return s === 'pending' || s === 'rescheduled';
    }
    return s === activeTab.toLowerCase();
  });

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
      <View style={styles.content}>
        
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
            data={filteredAppointments}
            keyExtractor={(item: any) => item.id || item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>{item.patient_name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.detailText}>{item.appointment_date}</Text>
                  <Ionicons name="time-outline" size={14} color="#666" style={{ marginLeft: 15 }} />
                  <Text style={styles.detailText}>{item.appointment_time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="medical-outline" size={14} color="#666" />
                  <Text style={[styles.detailText, { width: 200 }]}>{item.treatment_category || 'General'}</Text>
                </View>

                {activeTab === 'Pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.btn, styles.approveBtn]}
                      onPress={() => openApprove(item)}
                    >
                      <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, styles.rescheduleBtn]}
                      onPress={() => openReschedule(item)}
                    >
                      <Text style={styles.btnText} numberOfLines={1} adjustsFontSizeToFit>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => openCancel(item)}
                    >
                      <Text style={styles.btnTextDark} numberOfLines={1} adjustsFontSizeToFit>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab === 'Approved' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.btn, styles.completeBtn]}
                      onPress={() => openComplete(item)}
                    >
                      <Text style={styles.btnText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modals */}
      <RescheduleModal 
        visible={rescheduleVisible} 
        onClose={() => { setRescheduleVisible(false); fetchAppointments(); }} 
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
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6F4FE',
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabBtn: {
    backgroundColor: '#052A3F', // Dark blue for active tab
  },
  tabText: {
    color: '#052A3F',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeTabText: {
    color: '#FFF',
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
    fontSize: 18,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 5,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    flexShrink: 1,
    width: 110,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  approveBtn: {
    backgroundColor: '#2CA01C',
  },
  completeBtn: {
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
    textAlign: 'center'
  },
  btnTextDark: {
    color: '#666',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});
