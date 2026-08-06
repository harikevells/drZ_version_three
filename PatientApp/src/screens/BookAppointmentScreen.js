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
import { Calendar } from 'react-native-calendars';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { useIsFocused } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
// EmailJS credentials removed as we now use our custom backend endpoint

// Important: If using Android Emulator, use '10.0.2.2'. If using Wired USB Debugging, use 'localhost'. If using Wi-Fi, use your local IP address.
import { API_BASE_URL, RAZORPAY_KEY_ID } from '../config';
const BASE_URL = API_BASE_URL;


const parseTimeStringToMinutes = (timeStr) => {
  try {
    let clean = timeStr.toLowerCase().replace(/\s+/g, ' ').trim();
    let isPM = clean.includes('pm');
    let isAM = clean.includes('am');
    clean = clean.replace('am', '').replace('pm', '').trim();

    let hours = -1;
    let minutes = 0;

    if (clean.includes(':') || clean.includes('.')) {
      let parts = clean.split(/[:.]/);
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    } else {
      const spaceParts = clean.split(/\s+/);
      if (spaceParts.length >= 2) {
        hours = parseInt(spaceParts[0], 10);
        minutes = parseInt(spaceParts[1], 10);
      } else {
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length === 3) {
          hours = parseInt(digitsOnly.substring(0, 1), 10);
          minutes = parseInt(digitsOnly.substring(1, 3), 10);
        } else if (digitsOnly.length === 4) {
          hours = parseInt(digitsOnly.substring(0, 2), 10);
          minutes = parseInt(digitsOnly.substring(2, 4), 10);
        } else if (digitsOnly.length === 1 || digitsOnly.length === 2) {
          hours = parseInt(digitsOnly, 10);
          minutes = 0;
        }
      }
    }

    if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
      return -1;
    }

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  } catch (err) {
    return -1;
  }
};

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

  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();

  // Fetch unread notifications count
  useEffect(() => {
    if (isFocused && user) {
      const fetchUnreadCount = async () => {
        try {
          const mobile = user.contactNumber || user.mobile;
          const timestamp = new Date().getTime();
          const response = await axios.get(`${BASE_URL}/api/notifications/patient/${mobile}?t=${timestamp}`);
          const normalUnread = response.data.filter(n => !n.isRead).length;
          
          const pushRes = await axios.get(`${BASE_URL}/api/push-notifications/active`);
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const readPushIdsStr = await AsyncStorage.getItem('readPushNotificationIds');
          const readPushIds = readPushIdsStr ? JSON.parse(readPushIdsStr) : [];
          
          const pushUnread = (pushRes.data || []).filter(pn => {
            return !readPushIds.includes(pn._id || pn.id);
          }).length;
          
          setUnreadCount(normalUnread + pushUnread);
        } catch (error) {
          console.log("Error fetching notifications count", error);
        }
      };
      fetchUnreadCount();
    }
  }, [isFocused, user]);

  // --- Data State ---
  const [doctorCategories, setDoctorCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // --- Form State ---
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [gender, setGender] = useState('Male');
  const [selectedCategory, setSelectedCategory] = useState(null); // Used for Dropdown value

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Razorpay' or 'Cash'
  const [pendingBookingPayload, setPendingBookingPayload] = useState(null);

  // UI State
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isFocus, setIsFocus] = useState(false); // Used for Dropdown focus state
  const [isDoctorFocus, setIsDoctorFocus] = useState(false); // Used for Doctor Dropdown focus
  const [isDateFocus, setIsDateFocus] = useState(false); // Used for Date Dropdown focus
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [markedDates, setMarkedDates] = useState({});

  const [availableTimings, setAvailableTimings] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorList, setDoctorList] = useState([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState([]);
  const [dateSchedules, setDateSchedules] = useState([]);
  const [bookedByDoctor, setBookedByDoctor] = useState({});

  const getSelectedDoctorFee = () => {
    if (!selectedDoctor) return 0;
    const doc = allDoctors.find(d => 
      (d._id === selectedDoctor._id || d.id === selectedDoctor._id || d.doctorName === selectedDoctor.name)
    );
    return doc?.fees || selectedDoctor?.fees || 0;
  };


  const formatDate = (rawDate) => {
    const d = new Date(rawDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  useEffect(() => {
    fetchSchedulesForDate(date);
  }, [date]);

  useEffect(() => {
    const fetchAllAvailableDates = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/schedules`);
        const allSchedules = response.data || [];
        const approvedSchedules = allSchedules.filter(s => s.status === 'Approved');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const marked = {};

        // Disable past 30 days and next 90 days by default
        for (let i = -30; i < 90; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          marked[dateStr] = { disabled: true, disableTouchEvent: true };
        }

        approvedSchedules.forEach(s => {
          if (s.date) {
            const scheduleDate = new Date(s.date);
            scheduleDate.setHours(0, 0, 0, 0);
            if (scheduleDate >= today) {
              const dateStr = `${scheduleDate.getFullYear()}-${String(scheduleDate.getMonth() + 1).padStart(2, '0')}-${String(scheduleDate.getDate()).padStart(2, '0')}`;
              marked[dateStr] = { disabled: false };
            }
          }
        });

        setMarkedDates(marked);
      } catch (error) {
        console.log("Error fetching all schedules for dates", error);
      }
    };
    fetchAllAvailableDates();
  }, []);

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
        let uniqueTimings = [...new Set(allTimings)];

        // Exclude past timings if the selected date is today
        const today = new Date();
        const d = new Date(date);
        const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
        if (isToday) {
          const currentMinutes = today.getHours() * 60 + today.getMinutes();
          uniqueTimings = uniqueTimings.filter(t => {
            const startStr = t.split(/to|\-/)[0].trim();
            const startMins = parseTimeStringToMinutes(startStr);
            return startMins > currentMinutes;
          });
        }

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
        axios.get(`${BASE_URL}/api/emails/booked-timings?appointment_date=${encodeURIComponent(formattedDateForAppointments)}&_t=${Date.now()}`),
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
        if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
        const docName = (app.doctor_name || '').trim();
        if (!bookedMap[docName]) bookedMap[docName] = [];
        bookedMap[docName].push((app.appointment_time || '').trim());
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
            if (fullDeptName) uniqueDepts.add(fullDeptName);
          });
        }
      });

      const tamilTranslations = {
        'Cardiology': 'இருதயவியல்',
        'Neurology': 'நரம்பியல்',
        'Orthopedics': 'எலும்பியல்',
        'Pediatrics': 'குழந்தை மருத்துவம்',
        'Dermatology': 'தோல் மருத்துவம்',
        'General Surgery': 'பொது அறுவை சிகிச்சை',
        'Psychiatry': 'மனநல மருத்துவம்',
        'Gynecology': 'மகளிர் மருத்துவம்',
        'Oncology': 'புற்றுநோயியல்',
        'Ophthalmology': 'கண் மருத்துவம்',
        'Urology': 'சிறுநீரகவியல்',
        'ENT': 'காது மூக்கு தொண்டை',
        'Dentistry': 'பல் மருத்துவம்',
        'Radiology': 'கதிரியக்கவியல்',
        'General Physician': 'பொது மருத்துவர்',
        'General': 'பொது',
        'General Medicine': 'பொது மருத்துவம்',
        'Psychotherapy': 'உளவியல் சிகிச்சை'
      };

      const departments = Array.from(uniqueDepts);
      const formattedCategories = departments.map((cat, index) => {
        const originalName = cat.split('/')[0].trim();
        const tamilName = tamilTranslations[originalName];
        const displayName = (tamilName && !cat.includes('/')) ? `${originalName} / ${tamilName}` : cat;

        return {
          _id: String(index + 1),
          name: displayName,
          originalName: originalName,
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
    if (!selectedCategory) {
      Alert.alert("Required / தேவை", "Please select a category.\nபிரிவைத் தேர்ந்தெடுக்கவும்.");
      return;
    }
    if (!selectedDoctor) {
      Alert.alert("Required / தேவை", "Please select a doctor.\nமருத்துவரைத் தேர்ந்தெடுக்கவும்.");
      return;
    }
    if (selectedTimes.length === 0) {
      Alert.alert("Required / தேவை", "Please select an appointment timing.\nநேரத்தைத் தேர்ந்தெடுக்கவும்.");
      return;
    }

    const consultFee = getSelectedDoctorFee();

    const basePayload = {
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
      consultation_fee: Number(consultFee) || 0,
    };

    if (paymentMethod === 'Razorpay') {
      if (consultFee <= 0) {
        Alert.alert("Invalid Fee / தவறான கட்டணம்", "Online payment requires a fee greater than 0. Please select 'Pay at Clinic' (நேரடி).\n\nஆன்லைன் செலுத்துதலுக்கு கட்டணம் 0 ஐ விட அதிகமாக இருக்க வேண்டும்.");
        return;
      }
      setPendingBookingPayload(basePayload);
      
      try {
        setSendingEmail(true);
        const amountInPaise = Math.round(Number(consultFee) * 100);
        const orderRes = await axios.post(`${BASE_URL}/api/razorpay/create-order`, { amount: amountInPaise });
        if(orderRes.data && orderRes.data.id) {
          const orderId = orderRes.data.id;
          const keyId = RAZORPAY_KEY_ID || 'rzp_test_TBHWixI1texlea';
          const patientMobile = whatsapp || user?.contactNumber || user?.mobile || '';

          var options = {
            description: 'Doctor Consultation Fee',
            image: 'https://cdn.pixabay.com/photo/2021/11/20/03/16/doctor-6810750_1280.png',
            currency: 'INR',
            key: keyId,
            amount: amountInPaise,
            name: 'DrZ',
            order_id: orderId,
            prefill: {
              contact: patientMobile,
              name: patientName,
            },
            theme: { color: '#1C3E55' }
          };

          RazorpayCheckout.open(options).then(async (data) => {
            // Success
            const finalPayload = {
              ...basePayload,
              payment_id: data.razorpay_payment_id,
              payment_method: 'Razorpay',
              payment_status: 'Paid',
            };
            await executeBooking(finalPayload);
          }).catch((error) => {
            // Error
            Alert.alert('Payment Failed', `Error: ${error.description || 'Payment was cancelled or failed.'}`);
          });

        } else {
           Alert.alert("Error", "Could not generate order ID for payment.");
        }
      } catch (err) {
         console.error(err);
         Alert.alert("Error", "Failed to generate Razorpay order.");
      } finally {
         setSendingEmail(false);
      }
    } else {
      const finalPayload = {
        ...basePayload,
        payment_id: 'CASH_' + Date.now(),
        payment_method: 'Cash',
        payment_status: 'Pending',
      };
      await executeBooking(finalPayload);
    }
  };

  const executeBooking = async (payload) => {
    setSendingEmail(true);
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
          [{ text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] }) }]
        );
      } else {
        Alert.alert("Error", "Something went wrong sending the appointment request.");
      }
    } catch (error) {
      console.error("Booking Error:", error);
      const errorMessage = error.response
        ? `Status: ${error.response.status}\n${JSON.stringify(error.response.data)}`
        : error.message;
      Alert.alert("Failed", `Booking failed.\n${errorMessage}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleLogoutPress = () => setShowLogoutModal(true);
  const confirmLogout = () => { setShowLogoutModal(false); logout(); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {/* --- FIXED HEADER SECTION --- */}
        <View style={{ paddingHorizontal: 24, paddingTop: 24, backgroundColor: '#fff', zIndex: 10 }}>
          {/* HEADER */}
          <View style={[styles.headerContainer, { marginTop: 0 }]}>
            {/* Left: Welcome Pill */}
            <View style={styles.welcomePill}>
              <View style={styles.logoCircle}>
                <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.welcomeText}>Book Appointment</Text>
            </View>

            {/* Right: Notification Bell */}
            <TouchableOpacity onPress={() => navigation.navigate('NotificationPatient')} style={styles.bellButton}>
              <Icon name="bell-outline" size={24} color="#5F76FE" />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* BACK BUTTON */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonRow}>
            <Icon name="arrow-left" size={22} color="#555" />
            <Text style={styles.backButtonText}>Back / பின்செல்</Text>
          </TouchableOpacity>
        </View>

        {/* --- SCROLLABLE CONTENT --- */}
        <ScrollView contentContainerStyle={[styles.container, { paddingTop: 0 }]} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">

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

              {/* 5. DATE (Calendar Modal) */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Select Date</Text>
                  <Text style={styles.labelTamil}>தேதியை தேர்ந்தெடுக்கவும்</Text>
                </View>

                <TouchableOpacity style={[styles.inputBox, { justifyContent: 'space-between', paddingHorizontal: 16 }]} onPress={() => setShowCalendar(true)}>
                  <Text style={{ flex: 1, fontSize: 16, color: '#333' }}>{formatDate(date)}</Text>
                  <Icon name="calendar-month" size={24} color="#888" />
                </TouchableOpacity>
              </View>

              <Modal visible={showCalendar} transparent={true} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
                <TouchableOpacity style={styles.centerModalOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
                  <View style={{ width: '90%', backgroundColor: '#fff', borderRadius: 15, padding: 10, elevation: 5 }}>
                    <Calendar
                      minDate={new Date().toISOString().split('T')[0]}
                      markedDates={{
                        ...markedDates,
                        [`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`]: {
                          ...(markedDates[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`] || {}),
                          selected: true,
                          selectedColor: '#359E0E',
                        }
                      }}
                      onDayPress={(day) => {
                        const dateStr = day.dateString;
                        if (markedDates[dateStr] && markedDates[dateStr].disabled) {
                          return; // Date is disabled
                        }
                        const newDate = new Date(day.timestamp);
                        setDate(newDate);
                        setShowCalendar(false);
                      }}
                      theme={{
                        todayTextColor: '#359E0E',
                        arrowColor: '#359E0E',
                        textDayFontWeight: 'bold',
                      }}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>

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
                      name: doc.doctorName,
                      fees: doc.fees || 0
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

              {/* 4.6 DOCTOR CONSULTATION FEE */}
              {selectedDoctor && (
                <View style={styles.section}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Doctor Consultation Fee</Text>
                    <Text style={styles.labelTamil}>மருத்துவர் ஆலோசனை கட்டணம்</Text>
                  </View>
                  <View style={styles.feeCard}>
                    <View style={styles.feeLeft}>
                      <Icon name="cash-multiple" size={24} color="#1C3E55" />
                      <Text style={styles.feeTitle}>Consult Fee / கட்டணம்</Text>
                    </View>
                    <Text style={styles.feeAmount}>₹{getSelectedDoctorFee()}</Text>
                  </View>
                </View>
              )}

              {/* 4.7 PAYMENT METHOD */}
              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Select Payment Method</Text>
                  <Text style={styles.labelTamil}>பணம் செலுத்தும் முறையை தேர்ந்தெடுக்கவும்</Text>
                </View>

                <View style={styles.paymentMethodRow}>
                  <TouchableOpacity
                    style={[styles.paymentBtn, paymentMethod === 'Razorpay' && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod('Razorpay')}
                    activeOpacity={0.8}
                  >
                    <Icon name="credit-card-outline" size={20} color={paymentMethod === 'Razorpay' ? '#fff' : '#1C3E55'} />
                    <Text style={[styles.paymentBtnText, paymentMethod === 'Razorpay' && styles.paymentBtnTextActive]}>
                      Razorpay (Online)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.paymentBtn, paymentMethod === 'Cash' && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod('Cash')}
                    activeOpacity={0.8}
                  >
                    <Icon name="cash" size={20} color={paymentMethod === 'Cash' ? '#fff' : '#1C3E55'} />
                    <Text style={[styles.paymentBtnText, paymentMethod === 'Cash' && styles.paymentBtnTextActive]}>
                      Pay at Clinic (நேரடி)
                    </Text>
                  </TouchableOpacity>
                </View>
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
                        const timeTrim = time.trim();
                        let isBooked = bookedTimingsForCurrentDoctor.includes(timeTrim);
                        if (!isBooked) {
                          const startMins = parseTimeStringToMinutes(timeTrim.split(/to|\-/)[0].trim());
                          isBooked = bookedTimingsForCurrentDoctor.some(booked => {
                            const bookedMins = parseTimeStringToMinutes(booked);
                            return bookedMins !== -1 && startMins !== -1 && bookedMins === startMins;
                          });
                        }
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
      {/* <View style={styles.navbar}>
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
      </View> */}

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
  container: { padding: 24, paddingBottom: 20 },

  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: -10,
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingRight: 16,
  },
  logoCircle: {
    width: 34,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 24,
    backgroundColor: '#F5F5F5',
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF4B4B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

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
  genderBtnActive: { backgroundColor: '#5F76FE' },
  genderText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#555' },
  genderTextActive: { color: '#fff' },

  // ✅ New Dropdown Styles
  dropdown: {
    height: 56,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    width: '100%',
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
  logoutText: { color: '#fff', fontWeight: 'bold' },

  // Fee Card & Payment Method
  feeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D0DCE5',
  },
  feeLeft: { flexDirection: 'row', alignItems: 'center' },
  feeTitle: { fontSize: 15, fontWeight: '700', color: '#1C3E55', marginLeft: 10 },
  feeAmount: { fontSize: 20, fontWeight: 'bold', color: '#359E0E' },
  paymentMethodRow: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentBtn: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  paymentBtnActive: { backgroundColor: '#1C3E55', borderColor: '#1C3E55' },
  paymentBtnText: { marginLeft: 8, fontSize: 13, fontWeight: '700', color: '#1C3E55' },
  paymentBtnTextActive: { color: '#fff' },
});


export default BookAppointmentScreen;