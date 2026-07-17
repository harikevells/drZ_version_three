import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      setLogoutModalVisible(false);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('loginTimestamp');
      
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
            const res = await axios.get('http://10.10.11.90:5000/api/doctors');
            const fullProfile = res.data.find((d: any) => d.email === parsedData.email);
            if (fullProfile) {
              setUserData({ ...parsedData, ...fullProfile });
            }
          } catch (apiError) {
            console.error('Failed to fetch full doctor profile', apiError);
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
      <View style={styles.topBlueBackground} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerLogout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.headerLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              <Image 
                source={require('../../assets/images/profile.png')} 
                style={{ width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 60 }} 
              />
            </View>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.doctorName}>Dr. {userData?.doctorName || 'Doctor'}</Text>
            <Text style={styles.doctorEmail}>{userData?.email || 'doctor@example.com'}</Text>
          </View>
        </View>

        <View style={styles.countsContainer}>
          <View style={styles.countBlock}>
            <Text style={styles.countNumber}>07</Text>
            <Text style={styles.countLabel}>Total Appointment</Text>
          </View>
          <View style={styles.countBlock}>
            <Text style={styles.countNumber}>08</Text>
            <Text style={styles.countLabel}>Cancel Appointment</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Profile Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={require('../../assets/images/doctorIcon.png')} style={styles.customIcon} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Specialization</Text>
              <Text style={styles.detailValue}>{userData?.department ? userData.department.split(',').map((dept: string) => dept.split('/')[0].split('-')[0].trim()).filter(Boolean).join(', ') : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={require('../../assets/images/phoneIcon.png')} style={styles.customIcon} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <Text style={styles.detailValue}>{userData?.mobile || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={require('../../assets/images/experience.png')} style={styles.customIcon} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Experience</Text>
              <Text style={styles.detailValue}>{userData?.experience ? `${userData.experience} Years` : 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Image source={require('../../assets/images/profileIcon.png')} style={styles.customIcon} />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{userData?.gender || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setLogoutModalVisible(false)}
            >
              <Ionicons name="close-circle" size={26} color="#B0B0B0" />
            </TouchableOpacity>
            
            <View style={styles.modalHeader}>
              <Ionicons name="log-out-outline" size={24} color="#000" />
              <Text style={styles.modalTitle}>Logout</Text>
            </View>
            
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
    backgroundColor: '#FAFBFD',
  },
  topBlueBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#0066FF',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerLogout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoutText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 35,
    marginHorizontal: 15,
    marginBottom: 20,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: 20,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  doctorEmail: {
    fontSize: 14,
    color: '#666',
  },
  countsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 15,
    marginTop: 15,
    marginBottom: 30,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginHorizontal: 20,
  },
  countBlock: {
    flex: 1,
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5C7CFA',
    marginBottom: 4,
  },
  countLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  detailsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 25,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  iconBox: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  customIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#5C7CFA',
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF4C4C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    position: 'relative',
  },
  closeModalButton: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF4D4F',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 10,
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
