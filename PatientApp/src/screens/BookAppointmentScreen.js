import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image,
  Platform, Alert, ActivityIndicator, Modal, Linking, TextInput, KeyboardAvoidingView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
// ✅ Import the new Dropdown package
import { Dropdown } from 'react-native-element-dropdown';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

// EmailJS credentials removed as we now use our custom backend endpoint

// Important: If using Android Emulator, use '10.0.2.2'. If using Wired USB Debugging, use 'localhost'. If using Wi-Fi, use your local IP address.
const IP_ADDRESS = '10.10.11.90'; 
const PORT = '5000'; // Make sure your backend server is running on port 5000!
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

// --- Helper Components ---

const GenderSelector = ({ selected, onSelect }) => (
  <View style={styles.genderContainer}>
    <TouchableOpacity style={[styles.genderBtn, selected === 'Male' && styles.genderBtnActive]} onPress={() => onSelect('Male')}>
      <Icon name="face-man" size={22} color={selected === 'Male' ? '#fff' : '#555'} />
      <Text style={[styles.genderText, selected === 'Male' && styles.genderTextActive]}>Male / ஆண்</Text>
    </TouchableOpacity>
    <View style={{ width: 15 }} />
    <TouchableOpacity style={[styles.genderBtn, selected === 'Female' && styles.genderBtnActive]} onPress={() => onSelect('Female')}>
      <Icon name="face-woman" size={22} color={selected === 'Female' ? '#fff' : '#555'} />
      <Text style={[styles.genderText, selected === 'Female' && styles.genderTextActive]}>Female / பெண்</Text>
    </TouchableOpacity>
  </View>
);

const BookAppointmentScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { texts } = useContext(LanguageContext);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // --- Data State ---
  const [doctorCategories, setDoctorCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // --- Form State ---
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [gender, setGender] = useState('Male');
  const [selectedCategory, setSelectedCategory] = useState(null); // Used for Dropdown value

  // UI State
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isFocus, setIsFocus] = useState(false); // Used for Dropdown focus state
  const [isDoctorFocus, setIsDoctorFocus] = useState(false); // Used for Doctor Dropdown focus
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]); // Changed to array for multiple selection
  const [mode, setMode] = useState('date');
  const [showPicker, setShowPicker] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [availableTimings, setAvailableTimings] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState([]);
  const [dateSchedules, setDateSchedules] = useState([]);
  const [bookedByDoctor, setBookedByDoctor] = useState({});

  const formatDate = (rawDate) => { 
    const d = new Date(rawDate); 
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day} / ${month} / ${d.getFullYear()}`; 
  };

  useEffect(() => {
    fetchSchedulesForDate(date);
  }, [date]);

  useEffect(() => {
    if (selectedDoctor) {
      const schedulesForDoctor = dateSchedules.filter(s => 
        s.doctorId === selectedDoctor._id || 
        s.doctorId === selectedDoctor.id || 
        s.doctorName === selectedDoctor.name
      );
      
      if (schedulesForDoctor.length > 0) {
        // Merge all timings from all schedules for this doctor on this date
        const allTimings = schedulesForDoctor.flatMap(s => s.time || []);
        // Remove duplicates just in case
        const uniqueTimings = [...new Set(allTimings)];
        setAvailableTimings(uniqueTimings);
      } else {
        setAvailableTimings([]);
      }
    } else {
      setAvailableTimings([]);
    }
    setSelectedTimes([]);
  }, [selectedDoctor, dateSchedules]);

  const fetchSchedulesForDate = async (selectedDate) => {
    try {
      const d = new Date(selectedDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDateForSchedules = `${year}-${month}-${day}`;
      const formattedDateForAppointments = formatDate(selectedDate);

      const [schedulesRes, appointmentsRes, doctorsRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/schedules?date=${formattedDateForSchedules}`),
        axios.get(`${BASE_URL}/api/emails/booked-timings?appointment_date=${formattedDateForAppointments}`),
        axios.get(`${BASE_URL}/api/doctors`)
      ]);

      const liveDoctorsData = doctorsRes.data || [];
      setAllDoctors(liveDoctorsData);

      const approvedSchedules = schedulesRes.data.filter(s => {
         if (s.status !== 'Approved') return false;
         // Ensure the doctor still exists in the active doctors database
         return liveDoctorsData.some(doc => 
            (doc._id === s.doctorId || doc.id === s.doctorId) || 
            (doc.doctorName === s.doctorName)
         );
      });
      setDateSchedules(approvedSchedules);

      const appointments = appointmentsRes.data || [];
      const bookedMap = {};
      appointments.forEach(app => {
         if (!bookedMap[app.doctor_name]) bookedMap[app.doctor_name] = [];
         bookedMap[app.doctor_name].push(app.appointment_time);
      });
      setBookedByDoctor(bookedMap);

      // Now we cross-reference: get LIVE doctors who have an approved schedule today
      const activeDocsWithSchedules = liveDoctorsData.filter(doc => 
         approvedSchedules.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
      );
      setAvailableDoctorsForDate(activeDocsWithSchedules);

      // Dynamically extract unique departments from LIVE active doctors for this date
      const uniqueDepts = new Set();
      activeDocsWithSchedules.forEach(doc => {
        if (doc.department) {
           doc.department.split(',').forEach(dep => {
               const fullDeptName = dep.trim();
               if(fullDeptName) uniqueDepts.add(fullDeptName);
           });
        }
      });
      
      const departments = Array.from(uniqueDepts);
      const formattedCategories = departments.map((cat, index) => {
        return { 
          _id: String(index + 1), 
          name: cat, 
          originalName: cat.split('/')[0].trim(),
          fullDepartment: cat
        };
      });
      setDoctorCategories(formattedCategories);

      // Reset selections
      setSelectedCategory(null);
      setSelectedDoctor(null);
      setDoctorList([]);
    } catch (error) {
      console.log("Error fetching schedules", error);
    }
  };

  useEffect(() => {
    if (!user) { Alert.alert("Session Expired", "Please login again."); }
    else { setLoadingData(false); }
  }, [user]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  const showMode = (currentMode) => { setShowPicker(true); setMode(currentMode); };
  const formatTime = (rawDate) => {
    let hours = rawDate.getHours();
    let minutes = rawDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleSubmit = async () => {
    // ✅ Validations with Tamil
    if (!patientName.trim()) {
      Alert.alert("Required / தேவை", "Please enter patient name.\nநோயாளியின் பெயரை உள்ளிடவும்.");
      return;
    }
    if (!age.trim()) {
      Alert.alert("Required / தேவை", "Please enter age.\nவயதை உள்ளிடவும்.");
      return;
    }
    // WhatsApp Validation Removed - Optional
    // if (!whatsapp.trim() || whatsapp.length < 10) {
    //   Alert.alert("Required / தேவை", "Please enter valid WhatsApp number.\nசரியான வாட்ஸ்அப் எண்ணை உள்ளிடவும்.");
    //   return;
    // }
    if (!selectedCategory) {
      Alert.alert("Required / தேவை", "Please select a category.\nபிரிவைத் தேர்ந்தெடுக்கவும்.");
      return;
    }

    setSendingEmail(true);

    const payload = {
      patient_name: patientName,
      patient_age: age,
      patient_gender: gender,
      whatsapp_number: whatsapp,
      login_mobile: user?.contactNumber || user?.mobile || "N/A",
      treatment_category: selectedCategory.originalName,
      doctor_name: selectedDoctor ? selectedDoctor.name : "N/A",
      appointment_date: formatDate(date),
      appointment_time: selectedTimes.length > 0 ? selectedTimes.join(', ') : "Not Selected",
      video_call: isVideoCall ? "Yes" : "No",
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/emails/book`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200 || response.data.message) {
        Alert.alert(
          "Success / வெற்றி",
          "Appointment Request Sent Successfully!\nஉங்கள் முன்பதிவு கோரிக்கை அனுப்பப்பட்டது.",
          [{ text: "OK", onPress: () => navigation.navigate('Dashboard') }]
        );
      } else {
        Alert.alert("Error", "Something went wrong sending the email.");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      const errorMessage = error.response
        ? `Status: ${error.response.status}\n${JSON.stringify(error.response.data)}`
        : error.message;
      Alert.alert("Failed", `Booking failed.\n${errorMessage}`);
    }
    finally { setSendingEmail(false); }
  };
  const handleLogoutPress = () => setShowLogoutModal(true);
  const confirmLogout = () => { setShowLogoutModal(false); logout(); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={require('../assets/logo.png')} style={styles.userImage} resizeMode="contain" />
              <View style={styles.textContainer}>
                <Text style={styles.greeting}>DrZ</Text>
                <Text style={styles.subGreeting}>Book Appointment</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={handleLogoutPress}>
              <Icon name="logout" size={24} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          {/* BACK BUTTON */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonRow}>
            <Icon name="arrow-left" size={22} color="#555" />
            <Text style={styles.backButtonText}>Back / பின்செல்</Text>
          </TouchableOpacity>

          {loadingData ? <ActivityIndicator size="large" color="#1C3E55" style={{ marginTop: 50 }} /> : (
            <View style={{ zIndex: 10 }}>

              {/* 1. PATIENT NAME */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Enter Patient Name</Text>
                  <Text style={styles.labelTamil}>நோயாளியின் பெயரை உள்ளிடவும்</Text>
                </View>
                <TextInput
                  style={styles.inputBox}
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="Name / பெயர்"
                  placeholderTextColor="#aaa"
                />
              </View>

              {/* 2. ROW: AGE & GENDER */}
              <View style={[styles.section, styles.rowLayout]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Patient Age</Text>
                    <Text style={styles.labelTamil}>நோயாளியின் வயது</Text>
                  </View>
                  <TextInput
                    style={[styles.inputBox, { textAlign: 'center' }]}
                    value={age}
                    onChangeText={setAge}
                    placeholder="00"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>


              </View>
              <View style={{ flex: 1, marginBottom: '19' }}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Gender</Text>
                  <Text style={styles.labelTamil}>பாலினத்தைத் தேர்ந்தெடுக்கவும்</Text>
                </View>
                <GenderSelector selected={gender} onSelect={setGender} />
              </View>

              {/* 3. WHATSAPP */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>WhatsApp No</Text>
                  <Text style={styles.labelTamil}>வாட்ஸ்அப் எண்</Text>
                </View>
                <TextInput
                  style={styles.inputBox}
                  value={whatsapp}
                  onChangeText={setWhatsapp}
                  placeholder="Enter WhatsApp No (Optional)"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>

              {/* 5. DATE (Moved up) */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Select Date</Text>
                  <Text style={styles.labelTamil}>தேதியை தேர்ந்தெடுக்கவும்</Text>
                </View>
                <TouchableOpacity style={[styles.inputBox, { justifyContent: 'space-between', paddingHorizontal: 16 }]} onPress={() => showMode('date')}>
                  <Text style={{ flex: 1, fontSize: 16, color: '#333' }}>{formatDate(date)}</Text>
                  <Icon name="calendar-month" size={24} color="#888" />
                </TouchableOpacity>
              </View>
              {showPicker && <DateTimePicker value={date} mode={mode} is24Hour={false} display="default" onChange={onChangeDate} />}

              {/* 4. DOCTOR CATEGORY */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Select Treatment Category</Text>
                  <Text style={styles.labelTamil}>சிகிச்சை வகையை தேர்ந்தெடுக்கவும்</Text>
                </View>

                <Dropdown
                  style={[styles.dropdown, isFocus && { borderColor: '#1C3E55' }]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  itemTextStyle={{ color: 'black' }}
                  data={doctorCategories.length === 0 ? [{ _id: '0', name: 'No categories found for this date' }] : doctorCategories}
                  search
                  maxHeight={300}
                  labelField="name"
                  valueField="_id"
                  placeholder={!isFocus ? (doctorCategories.length === 0 ? 'No categories found' : 'Select Category...') : '...'}
                  searchPlaceholder="Search..."
                  value={selectedCategory ? selectedCategory._id : null}
                  onFocus={() => setIsFocus(true)}
                  onBlur={() => setIsFocus(false)}
                  onChange={item => {
                    if (item._id === '0') return;
                    setSelectedCategory(item);
                    setIsFocus(false);
                    // Filter LIVE doctors who are AVAILABLE on the selected date
                    const docsForCategory = availableDoctorsForDate.filter(doc => {
                      if (!doc.department) return item.originalName === 'Others';
                      const depts = doc.department.split(',').map(cat => cat.trim());
                      return depts.includes(item.fullDepartment);
                    });
                    
                    const formattedDoctors = docsForCategory.map(doc => ({
                       _id: doc._id || doc.id,
                       name: doc.doctorName
                    }));
                    setDoctorList(formattedDoctors);
                    setSelectedDoctor(null);
                  }}
                  renderLeftIcon={() => (
                    <Icon
                      style={styles.icon}
                      color={isFocus ? '#1C3E55' : 'black'}
                      name="stethoscope"
                      size={20}
                    />
                  )}
                />
              </View>

              {/* 4.5 SELECT DOCTOR NAME */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Select Doctor Name</Text>
                  <Text style={styles.labelTamil}>மருத்துவர் பெயரை தேர்ந்தெடுக்கவும்</Text>
                </View>

                <Dropdown
                  style={[styles.dropdown, isDoctorFocus && { borderColor: '#1C3E55' }]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  itemTextStyle={{ color: 'black' }}
                  data={doctorList.length === 0 ? [{ _id: '0', name: 'No doctors found' }] : doctorList}
                  search
                  maxHeight={300}
                  labelField="name"
                  valueField="_id"
                  placeholder={!isDoctorFocus ? (doctorList.length === 0 ? 'No doctors found' : 'Select Doctor...') : '...'}
                  searchPlaceholder="Search..."
                  value={selectedDoctor ? selectedDoctor._id : null}
                  onFocus={() => setIsDoctorFocus(true)}
                  onBlur={() => setIsDoctorFocus(false)}
                  onChange={item => {
                    if (item._id === '0') return;
                    setSelectedDoctor(item);
                    setIsDoctorFocus(false);
                  }}
                  renderLeftIcon={() => (
                    <Icon
                      style={styles.icon}
                      color={isDoctorFocus ? '#1C3E55' : 'black'}
                      name="doctor"
                      size={20}
                    />
                  )}
                />
              </View>

              {/* 6. AVAILABLE TIMINGS */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Select Available Timings</Text>
                  <Text style={styles.labelTamil}>கிடைக்கும் நேரங்களை தேர்ந்தெடுக்கவும்</Text>
                </View>
                
                <View style={styles.timingsContainer}>
                  {availableTimings.length > 0 ? (
                    <View style={styles.timingsGrid}>
                      {availableTimings.map((time, index) => {
                        const bookedTimingsForCurrentDoctor = selectedDoctor ? (bookedByDoctor[selectedDoctor.name] || []) : [];
                        const isBooked = bookedTimingsForCurrentDoctor.includes(time);
                        const isSelected = selectedTimes.includes(time);
                        return (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.timingCard} 
                            onPress={() => {
                              if (isBooked) return;
                              setSelectedTimes(prev => 
                                prev.includes(time) ? [] : [time]
                              );
                            }}
                            activeOpacity={isBooked ? 1 : 0.7}
                          >
                            <View style={[styles.timingBox, isBooked ? { backgroundColor: '#E74C3C' } : (isSelected ? styles.timingBoxSelected : styles.timingBoxUnselected)]}>
                              {isSelected && !isBooked && <Icon name="check" size={14} color="#fff" style={{ alignSelf: 'center', marginTop: 1 }} />}
                            </View>
                            <Text style={[styles.timingText, isBooked && { color: '#E74C3C', textDecorationLine: 'line-through' }]}>{time.split(' to ')[0]}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 10 }}>
                      No timings available / நேரங்கள் கிடைக்கவில்லை
                    </Text>
                  )}
                </View>
              </View>

              {/* 6. VIDEO CALL */}
              <View style={styles.section}>
                <TouchableOpacity style={styles.videoCard} onPress={() => setIsVideoCall(!isVideoCall)} activeOpacity={0.8}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.videoTitle}>Video Call Request</Text>
                    <Text style={styles.videoSubtitle}>டாக்டருடன் வீடியோ அழைப்பு வேண்டுமா?</Text>
                  </View>
                  <Icon name={isVideoCall ? "toggle-switch" : "toggle-switch-off-outline"} size={50} color={isVideoCall ? "#359E0E" : "#ccc"} />
                </TouchableOpacity>
              </View>

              {/* SUBMIT */}
              <TouchableOpacity style={[styles.submitButton, sendingEmail && { backgroundColor: '#888' }]} onPress={handleSubmit} disabled={sendingEmail}>
                {sendingEmail ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Confirm Booking / முன்பதிவை உறுதி செய்</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
          <Icon name="home" size={28} color="#1C3E55" />
          <Text style={[styles.navText, { fontWeight: 'bold', color: '#1C3E55' }]}>Home</Text>
          <Text style={[styles.navText, { fontSize: 15, color: '#1C3E55' }]}>ஹோம்</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard', { screen: 'PaymentTab' })}>
          <Icon name="qrcode-scan" size={28} color="#1C3E55" />
          <Text style={[styles.navText, { fontWeight: 'bold', color: '#1C3E55' }]}>Payment</Text>
          <Text style={[styles.navText, { fontSize: 10, color: '#1C3E55' }]}>பேமெண்ட்</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { Linking.openURL('801').catch(err => Alert.alert('Error', 'Unable to open dialer')); }}>
          <Icon name="ambulance" size={28} color="#888" />
          <Text style={styles.navText}>Ambulance</Text>
          <Text style={[styles.navText, { fontSize: 10 }]}> ஆம்புலன்ஸ்</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent={true} animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.centerModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Icon name="logout" size={40} color="#E74C3C" style={{ marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.logoutBtn]} onPress={confirmLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingBottom: 130 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userImage: { width: width * 0.15, height: width * 0.08, marginRight: 15 },
  textContainer: { justifyContent: 'center' },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1C3E55' },
  subGreeting: { fontSize: 14, color: '#666' , width:150},
  iconButton: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 30 },

  backButtonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backButtonText: { fontSize: 16, fontWeight: '600', color: '#555', marginLeft: 8 },

  // Sections
  section: { marginBottom: 24 },
  rowLayout: { flexDirection: 'row', justifyContent: 'space-between' },

  // Labels
  labelRow: { marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '700', color: '#333' },
  labelTamil: { fontSize: 12, color: '#777', marginTop: 2 },

  // Inputs
  inputBox: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    color: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  // Gender Buttons
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 56 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  genderBtnActive: { backgroundColor: '#1C3E55', borderColor: '#1C3E55' },
  genderText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#555' },
  genderTextActive: { color: '#fff' },

  // ✅ New Dropdown Styles
  dropdown: {
    height: 56,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    width:'100%',
    borderRadius: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FAFAFA',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#aaa',
    marginLeft: 10
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  icon: {
    marginRight: 5,
  },

  // Date Cards & Timings Grid
  dateCard: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFA' },
  dateLabel: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  dateLabelTamil: { fontSize: 10, color: '#888' },
  dateValue: { fontSize: 16, fontWeight: 'bold', color: '#1C3E55', marginTop: 4 },
  
  timingsContainer: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, backgroundColor: '#FAFAFA' },
  timingsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  timingCard: { width: '33%', flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timingBox: { width: 18, height: 18, borderRadius: 4, marginRight: 8 },
  timingBoxSelected: { backgroundColor: '#359E0E' },
  timingBoxUnselected: { backgroundColor: '#E0E0E0' },
  timingText: { fontSize: 12, fontWeight: '700', color: '#333' },

  // Video Card
  videoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F8FF', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#D0E1E8' },
  videoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C3E55' },
  videoSubtitle: { fontSize: 12, color: '#666', marginTop: 4 },

  // Submit Button
  submitButton: { backgroundColor: '#359E0E', paddingVertical: 18, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', elevation: 4, marginTop: 10 },
  submitButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.8, textAlign: 'center' },

  // Navbar
  navbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 8, borderTopColor: '#eee', height: 85, position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 20, paddingBottom: 5 },
  navItem: { alignItems: 'center', justifyContent: 'center', padding: 5 },
  navText: { fontSize: 8, color: '#888', marginTop: 4 },

  // Modal
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  logoutModalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButtonRow: { flexDirection: 'row', width: '100%', gap: 15 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
  logoutBtn: { backgroundColor: '#E74C3C' },
  cancelText: { color: '#333', fontWeight: 'bold' },
  logoutText: { color: '#fff', fontWeight: 'bold' }
});

export default BookAppointmentScreen;