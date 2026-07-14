import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, Modal, TextInput, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [cancelledAppointments, setCancelledAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadCampsCount, setUnreadCampsCount] = useState(0);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchUnreadCamps = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/push-notifications`);
          const allCamps = res.data;
          
          const storedData = await AsyncStorage.getItem('userData');
          let user = storedData ? JSON.parse(storedData) : null;
          
          const seenKey = user?.email ? `seenMedicalCampIds_${user.email}` : 'seenMedicalCampIds';
          const seenStr = await AsyncStorage.getItem(seenKey);
          const seenIds = seenStr ? JSON.parse(seenStr) : [];
          
          if (user?.email) {
            try {
              const docRes = await axios.get(`${API_BASE_URL}/doctors`);
              const fullProfile = docRes.data.find((d: any) => d.email === user.email);
              if (fullProfile) user = { ...user, ...fullProfile };
            } catch (e) {}
          }
          const doctorName = user?.doctorName || '';

          const unseenCount = allCamps.filter((camp: any) => {
            if (camp.role === 'doctor' && camp.doctorName === doctorName) return false;
            return !seenIds.includes(camp._id);
          }).length;
          
          setUnreadCampsCount(unseenCount);
        } catch (error) {
          console.error('Failed to fetch unread camps count', error);
        }
      };
      fetchUnreadCamps();
    }, [])
  );
  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error("Logout failed", error);
      Alert.alert("Error", "Failed to logout");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setUserData(parsedData);

          try {
            const res = await axios.get(`${API_BASE_URL}/doctors`);
            const fullProfile = res.data.find((d: any) => d.email === parsedData.email);
            if (fullProfile) {
              setUserData({ ...parsedData, ...fullProfile });
            }
          } catch (apiError) {
            console.error('Failed to fetch full doctor profile', apiError);
          }

          if (parsedData.doctorName) {
            try {
              const aptRes = await axios.get(`${API_BASE_URL}/appointments/all/${parsedData.doctorName}`);
              const appointments = aptRes.data;
              setTotalAppointments(appointments.length);
              const cancelled = appointments.filter((a: any) =>
                a.status === 'Cancelled' || a.status === 'Cancel' || a.status === 'Canceled'
              ).length;
              setCancelledAppointments(cancelled);
            } catch (aptError) {
              console.error('Failed to fetch appointments count', aptError);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
          <Text style={styles.headerTitle}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFF" />
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.whiteBackground}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/doctorlogo.png')}
                style={{ width: '100%', height: '100%', borderRadius: 60, resizeMode: 'cover' }}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.doctorName}>Dr. {userData?.doctorName || 'Doctor'}</Text>
              <Text style={styles.doctorEmail}>{userData?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.statsBoxContainer}>
            <View style={styles.statsBox}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {totalAppointments.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.statLabel}>Total Appointment</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {cancelledAppointments.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.statLabel}>Cancel Appointment</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Profile Details</Text>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="person" size={22} color="#6B7AFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Specialization</Text>
                <Text style={styles.detailValue}>{userData?.department ? userData.department.split(',').map((dept: string) => dept.split('/')[0].split('-')[0].trim()).filter(Boolean).join(', ') : 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="call" size={22} color="#6B7AFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Mobile Number</Text>
                <Text style={styles.detailValue}>{userData?.mobile || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="briefcase" size={22} color="#6B7AFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>{userData?.experience ? `${userData.experience} Years` : 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.iconBox}>
                <Ionicons name="person" size={22} color="#6B7AFF" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Gender</Text>
                <Text style={styles.detailValue}>{userData?.gender || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('MedicalCampNotification', { defaultMode: 'list' })}
      >
        <Ionicons name="medkit" size={28} color="#FFF" />
        {unreadCampsCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{unreadCampsCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setLogoutModalVisible(false)}
            >
              <Ionicons name="close-circle" size={24} color="#999" />
            </TouchableOpacity>

            <Image
              source={require('../assets/DoctorlogoApp1.png')}
              style={styles.modalLogo}
              resizeMode="contain"
            />

            <Text style={styles.modalText}>Are you sure you want to logout?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',

  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,

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
  headerLogoutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    width: '95%',
    alignSelf: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    backgroundColor: '#FFF',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  doctorEmail: {
    fontSize: 14,
    color: '#334155',
  },
  statsBoxContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    marginTop: -15,
  },
  statsBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 25,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#6B7AFF',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
  },
  detailsContainer: {
    paddingHorizontal: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  iconBox: {
    width: 30,
    height: 30,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginRight: 15,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6B7AFF',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 15,
    color: '#1E293B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '85%',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  modalLogo: {
    width: 120,
    height: 60,
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmBtn: {
    backgroundColor: '#FF4D4D',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: '#0D6EFD',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
    color: '#333',
    backgroundColor: '#FFF',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputHalf: {
    flex: 0.48,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
    backgroundColor: '#FFF',
  },
  dateInputField: {
    flex: 1,
    color: '#333',
    paddingVertical: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    backgroundColor: '#FAFAFA',
  },
  uploadText: {
    marginTop: 12,
    color: '#888',
    fontSize: 13,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  closeCalendarBtn: {
    marginTop: 15,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
  },
  closeCalendarText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
