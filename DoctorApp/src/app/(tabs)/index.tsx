import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import RescheduleModal from '../../components/RescheduleModal';
import ApproveModal from '../../components/ApproveModal';

const PATIENTS = [
  { id: '1', name: 'Arjun Suresh', date: '25/03/2026', time: '10:30 AM - 12:00 PM' },
  { id: '2', name: 'Arjun Suresh', date: '25/03/2026', time: '12:30 PM - 02:00 PM' },
];

const RECENT_PATIENTS = [
  { id: '1', name: 'Meenu', image: 'https://i.pravatar.cc/100?img=5' },
  { id: '2', name: 'Arjun', image: 'https://i.pravatar.cc/100?img=11' },
  { id: '3', name: 'Kavya', image: 'https://i.pravatar.cc/100?img=9' },
  { id: '4', name: 'Rahul', image: 'https://i.pravatar.cc/100?img=12' },
];

export default function HomeScreen() {
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const [approveVisible, setApproveVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const openReschedule = (patient: any) => {
    setSelectedPatient(patient);
    setRescheduleVisible(true);
  };

  const openApprove = (patient: any) => {
    setSelectedPatient(patient);
    setApproveVisible(true);
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Appointments Summary */}
        <Text style={styles.sectionTitle}>Appointments</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>05</Text>
            <Text style={styles.statLabel}>Today's{'\n'}Appointment</Text>
            <Ionicons name="calendar-outline" size={16} color="#2CA01C" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>02</Text>
            <Text style={styles.statLabel}>Pending{'\n'}Appointment</Text>
            <Ionicons name="time-outline" size={16} color="#FFA500" style={styles.statIcon} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>82</Text>
            <Text style={styles.statLabel}>Total Patients{'\n'}Attended</Text>
            <Ionicons name="people-outline" size={16} color="#052A3F" style={styles.statIcon} />
          </View>
        </View>

        {/* Patient Request */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patient Request</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {PATIENTS.map((patient) => (
          <View key={patient.id} style={styles.requestCard}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.dateTime}>{patient.date} {patient.time}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.btn, styles.approveBtn]}
                onPress={() => openApprove(patient)}
              >
                <Text style={styles.btnText}>Approve and Assign</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, styles.rescheduleBtn]}
                onPress={() => openReschedule(patient)}
              >
                <Text style={styles.btnText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]}>
                <Text style={styles.btnTextDark}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Recent Patient History */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Recent Patient History</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={RECENT_PATIENTS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.recentPatientCard}>
              <Image source={{ uri: item.image }} style={styles.recentAvatar} />
              <View style={styles.recentNameBadge}>
                <Text style={styles.recentName}>{item.name}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.recentList}
        />
        
      </ScrollView>

      {/* Modals */}
      <RescheduleModal 
        visible={rescheduleVisible} 
        onClose={() => setRescheduleVisible(false)} 
      />
      <ApproveModal 
        visible={approveVisible} 
        onClose={() => setApproveVisible(false)} 
        patientName={selectedPatient?.name}
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
    padding: 15,
    width: '31%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#052A3F',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
  },
  statIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
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
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  dateTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  btnTextDark: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recentList: {
    paddingVertical: 10,
  },
  recentPatientCard: {
    alignItems: 'center',
    marginRight: 15,
  },
  recentAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: -10, // overlap effect
    zIndex: 1,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  recentNameBadge: {
    backgroundColor: '#FF4C4C',
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  recentName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
