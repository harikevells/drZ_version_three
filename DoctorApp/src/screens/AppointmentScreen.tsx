import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import RescheduleModal from '../components/RescheduleModal';
import ApproveModal from '../components/ApproveModal';
import CompleteModal from '../components/CompleteModal';
import CancelModal from '../components/CancelModal';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const API_URL = 'http://10.10.11.90:5000/api/appointments';

export default function AppointmentScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Completed' | 'Cancelled'>('Pending');
  const [doctorName, setDoctorName] = useState('');
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [highlightedPatientName, setHighlightedPatientName] = useState<string | null>(null);

  // Modal states
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Filter States
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<{from: Date | null, to: Date | null}>({from: null, to: null});

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

  useEffect(() => {
    if (route.params?.highlightedPatientName) {
      setHighlightedPatientName(route.params.highlightedPatientName);
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

  useEffect(() => {
    if (highlightedPatientName && appointments.length > 0) {
      const appt = appointments.find(a => a.patient_name && a.patient_name.trim().toLowerCase() === highlightedPatientName.trim().toLowerCase());
      if (appt && appt.status) {
        const s = appt.status.toLowerCase();
        if (s === 'pending' || s === 'rescheduled') setActiveTab('Pending');
        else if (s === 'approved') setActiveTab('Approved');
        else if (s === 'cancelled' || s === 'canceled') setActiveTab('Cancelled');
        else if (s === 'completed') setActiveTab('Completed');
      }
    }
  }, [highlightedPatientName, appointments]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`${API_URL}/${id}/status`, { status });
      Alert.alert('Success', `Appointment ${status.toLowerCase()} successfully!`, [
        {
          text: 'OK',
          onPress: () => {
             if (status === 'Completed') {
               navigation.navigate('AddPrescription', { patient: selectedPatient });
             }
          }
        }
      ]);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update appointment status.');
    }
  };

  const openCancel = (patient: any) => {
    setHighlightedPatientName(null);
    setSelectedPatient(patient);
    setCancelVisible(true);
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

  const openComplete = (patient: any) => {
    setHighlightedPatientName(null);
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
    let matchesTab = false;
    if (activeTab === 'Pending') {
      matchesTab = s === 'pending' || s === 'rescheduled';
    } else {
      matchesTab = s === activeTab.toLowerCase();
    }
    
    if (!matchesTab) return false;

    // Apply date filter
    if (appliedFilters.from || appliedFilters.to) {
      if (!app.appointment_date) return false;
      
      const parts = app.appointment_date.split('/').map((p: string) => p.trim());
      if (parts.length === 3) {
        const appDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        appDate.setHours(0,0,0,0);
        
        if (appliedFilters.from) {
          const from = new Date(appliedFilters.from);
          from.setHours(0,0,0,0);
          if (appDate < from) return false;
        }
        if (appliedFilters.to) {
          const to = new Date(appliedFilters.to);
          to.setHours(0,0,0,0);
          if (appDate > to) return false;
        }
      }
    }
    return true;
  });

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const handleFilter = () => {
    setAppliedFilters({ from: fromDate, to: toDate });
  };

  const handleDownload = () => {
    if (!doctorName) return;
    
    let downloadUrl = `${API_URL}/download/${encodeURIComponent(doctorName)}?status=${activeTab}`;
    if (appliedFilters.from) {
      downloadUrl += `&from=${appliedFilters.from.toISOString().split('T')[0]}`;
    }
    if (appliedFilters.to) {
      downloadUrl += `&to=${appliedFilters.to.toISOString().split('T')[0]}`;
    }
    
    Alert.alert(
      'Download Report',
      'This will open your browser to download the CSV report. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Download', 
          onPress: () => {
            Linking.openURL(downloadUrl).catch(err => {
              console.error("Failed to open URL:", err);
              Alert.alert('Error', 'Could not start download.');
            });
          }
        }
      ]
    );
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
      <View style={styles.topBlueBackground} />
      <Header isBlueTheme={false} />
      <View style={styles.content}>
        
        <Text style={styles.pageTitle}>Appointment List</Text>
        
        {/* Date Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.datePickerContainer}>
            <Text style={styles.filterLabel}>From Date</Text>
            <TouchableOpacity onPress={() => setShowFromPicker(true)} style={styles.dateInputWrapper}>
              <Text style={styles.dateInputText}>{fromDate ? formatDate(fromDate) : 'dd/mm/yyyy'}</Text>
              {fromDate && (
                <TouchableOpacity onPress={() => { setFromDate(null); setAppliedFilters(prev => ({ ...prev, from: null })); }}>
                  <Icon name="close-circle" size={14} color="#999" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerContainer}>
            <Text style={styles.filterLabel}>To Date</Text>
            <TouchableOpacity onPress={() => setShowToPicker(true)} style={styles.dateInputWrapper}>
              <Text style={styles.dateInputText}>{toDate ? formatDate(toDate) : 'dd/mm/yyyy'}</Text>
              {toDate && (
                <TouchableOpacity onPress={() => { setToDate(null); setAppliedFilters(prev => ({ ...prev, to: null })); }}>
                  <Icon name="close-circle" size={14} color="#999" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.okButton} onPress={handleFilter}>
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Icon name="download" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {showFromPicker && (
          <DateTimePicker
            value={fromDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowFromPicker(false);
              if (selectedDate) setFromDate(selectedDate);
            }}
          />
        )}
        
        {showToPicker && (
          <DateTimePicker
            value={toDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowToPicker(false);
              if (selectedDate) setToDate(selectedDate);
            }}
          />
        )}

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
            style={[styles.tabBtn, activeTab === 'Canceled' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'Canceled' && styles.activeTabText]}>Canceled</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'Completed' && styles.activeTabBtn]}
            onPress={() => setActiveTab('Completed')}
          >
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.activeTabText]}>Completed</Text>
          </TouchableOpacity>
        </View>

        {filteredAppointments.length === 0 ? (
          <Text style={styles.noData}>No {activeTab.toLowerCase()} appointments.</Text>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item: any) => item.id || item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isHighlighted = highlightedPatientName && item.patient_name && item.patient_name.trim().toLowerCase() === highlightedPatientName.trim().toLowerCase();
              return (
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => {
                  if (isHighlighted) setHighlightedPatientName(null);
                }}
                style={[styles.requestCard, isHighlighted && { backgroundColor: '#E6F4FE', borderColor: '#0084FF', borderWidth: 1 }]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.patientName}>{item.patient_name}</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>{item.appointment_date} {item.appointment_time ? item.appointment_time.replace(' to ', ' - ') : ''}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailText, { width: 200 }]}>{item.treatment_category || 'Neurology'}</Text>
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
                    <TouchableOpacity 
                      style={[styles.btn, styles.cancelBtn]}
                      onPress={() => openCancel(item)}
                    >
                      <Text style={styles.btnTextDark}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
              );
            }}
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
    backgroundColor: '#FAFBFD',
  },
  topBlueBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#0066FF',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    paddingTop: 20,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 5,
  },
  datePickerContainer: {
    flex: 1,
    marginRight: 10,
  },
  filterLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  dateInputWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  okButton: {
    backgroundColor: '#6276F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
  },
  okButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  downloadButton: {
    backgroundColor: '#6276F5',
    paddingHorizontal: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 30,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 20,
  },
  tabBtn: {
    paddingVertical: 5,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: '#0066FF',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeTabText: {
    color: '#0066FF',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 110, // Added space so content isn't hidden behind the floating footer
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
    color: '#0084FF', // Blue text in image
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    flexShrink: 1,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
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
    backgroundColor: '#FFA500',
  },
  cancelBtn: {
    backgroundColor: '#E0E0E0',
  },
  btnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  btnTextDark: {
    color: '#666',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center'
  },
});
