import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  Platform, Alert, ActivityIndicator, PermissionsAndroid, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const IP_ADDRESS = '10.10.11.90'; 
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const { width, height } = Dimensions.get('window');

const VoiceBookingScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState('start'); 
  const currentStepRef = useRef(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  
  const [isListening, setIsListening] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    whatsapp: '',
    category: null,
    doctor: null,
    date: new Date(),
    time: ''
  });

  const [doctorCategories, setDoctorCategories] = useState([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState([]);
  const [dateSchedules, setDateSchedules] = useState([]);
  const [bookedByDoctor, setBookedByDoctor] = useState({});

  useEffect(() => {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
    }).catch((err) => {
      if (err.code === 'no_engine') {
        Tts.requestInstallEngine();
      }
    });

    // Initial greeting
    setTimeout(() => {
      addBotMessage("Hi,\nI am Your DrZ Voice Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ குரல் உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?", [
        { label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }
      ]);
    }, 500);

    return () => {
      Tts.stop();
    };
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      console.log("Speech error (normal if silent):", e);
      setIsListening(false);
      setRecognizedText('');
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setRecognizedText(e.value[0]); // Live updating text
      }
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setRecognizedText(text);
        Voice.stop();
        setIsListening(false);
        
        setTimeout(() => {
          if (!text.trim()) return;
          addUserMessage(text);
          setRecognizedText('');

          setTimeout(() => {
            const step = currentStepRef.current;
            if (step === 'name') {
              setFormData(prev => ({ ...prev, patientName: text }));
              setCurrentStep('age');
              addBotMessage("How old are you?\n\nஉங்கள் வயதை உள்ளிடவும்.");
            } else if (step === 'age') {
              setFormData(prev => ({ ...prev, age: text }));
              setCurrentStep('gender');
              addBotMessage("Please Select your gender.\n\nபாலினத்தை தேர்வு செய்யவும்.", [
                { label: 'Male / ஆண்', value: 'Male' },
                { label: 'Female / பெண்', value: 'Female' },
                { label: 'Others / மற்றவை', value: 'Others' }
              ]);
            } else if (step === 'whatsapp') {
              setFormData(prev => ({ ...prev, whatsapp: text }));
              setCurrentStep('date');
              addBotMessage("Please Select a Date from the calendar.\n\nகாலண்டரில் இருந்து தேதியை தேர்வு செய்யவும்.");
              setShowDatePicker(true);
            } else if (step === 'start') {
              addBotMessage("Hi,\nI am Your DrZ Voice Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ குரல் உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?", [
                { label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }
              ]);
            }
          }, 500);
        }, 500);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone so you can talk to the bot.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission denied');
          return;
        }
      }
      Tts.stop();
      setIsListening(true);
      await Voice.start('en-IN'); 
    } catch (e) {
      console.error("Start listening error", e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error("Stop listening error", e);
    }
  };

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, doctorCategories]);

  const addBotMessage = (text, options = []) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot: true, options }]);
    
    const parts = text.split('\n\n');
    const textToSpeak = parts.length > 1 ? parts[1] : parts[0];
    Tts.stop();
    Tts.speak(textToSpeak.replace(/\n/g, ' '));
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot: false }]);
  };

  const formatDate = (rawDate) => { 
    const d = new Date(rawDate); 
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day} / ${month} / ${d.getFullYear()}`; 
  };

  const fetchSchedulesForDate = async (selectedDate) => {
    setLoadingOptions(true);
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
      const approvedSchedules = schedulesRes.data.filter(s => {
         if (s.status !== 'Approved') return false;
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

      const activeDocsWithSchedules = liveDoctorsData.filter(doc => 
         approvedSchedules.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
      );
      setAvailableDoctorsForDate(activeDocsWithSchedules);

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
      const formattedCategories = departments.map((cat, index) => ({ 
          _id: String(index + 1), 
          label: cat, 
          value: cat,
          originalName: cat.split('/')[0].trim(),
          fullDepartment: cat
      }));
      setDoctorCategories(formattedCategories);
      
      if (formattedCategories.length > 0) {
        addBotMessage("Now, Select your treatment category you need.\n\nதேவையான சிகிச்சையை தேர்வு செய்யவும்.", formattedCategories);
      } else {
        addBotMessage("No available categories on this date. Please select another date.\n\nஇந்த தேதியில் மருத்துவர்கள் இல்லை. வேறு தேதியை தேர்வு செய்யவும்.");
        setCurrentStep('date');
        setShowDatePicker(true);
      }
      
    } catch (error) {
      addBotMessage("Error fetching data. Please try again.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleOptionSelect = (option, msgId) => {
    setMessages(prev => prev.map(msg => msg.id === msgId ? { ...msg, options: [] } : msg));
    addUserMessage(option.label.split('\n')[0]);
    Tts.stop();

    setTimeout(() => {
      if (currentStep === 'start' && option.value === 'book_appointment') {
        setCurrentStep('name');
        addBotMessage("Sure! Let's get started.\nWhat is your full name?\n\nசரி, ஆரம்பிக்கலாம். உங்கள் முழு பெயர் என்ன?");
        startListening();
      } else if (currentStep === 'gender') {
        setFormData(prev => ({ ...prev, gender: option.value }));
        setCurrentStep('whatsapp');
        addBotMessage("Great! Now, please share your whatsapp number.\n\nஅற்புதம்! இப்போது உங்கள் WhatsApp எண்ணை பகிரவும்.");
        startListening();
      } else if (currentStep === 'category') {
        const docsForCategory = availableDoctorsForDate.filter(doc => {
          if (!doc.department) return option.originalName === 'Others';
          const depts = doc.department.split(',').map(cat => cat.trim());
          return depts.includes(option.fullDepartment);
        });
        const formattedDoctors = docsForCategory.map(doc => ({
           _id: doc._id || doc.id,
           label: doc.doctorName + " / " + (doc.experience ? doc.experience + " Yrs" : ""),
           value: doc,
        }));
        
        if (formattedDoctors.length > 0) {
          setFormData(prev => ({ ...prev, category: option }));
          setCurrentStep('doctor');
          addBotMessage("Please select a Doctor\n\nமருத்துவரை தேர்வு செய்யவும்.", formattedDoctors);
        } else {
          addBotMessage("No available doctors for this category. Please select another category.\n\nஇந்த பிரிவில் மருத்துவர்கள் இல்லை. வேறு பிரிவை தேர்வு செய்யவும்.", doctorCategories);
          setCurrentStep('category');
        }
      } else if (currentStep === 'doctor') {
        setFormData(prev => ({ ...prev, doctor: option.value }));
        setCurrentStep('time');
        
        const schedulesForDoctor = dateSchedules.filter(s => 
          s.doctorId === option.value._id || 
          s.doctorId === option.value.id || 
          s.doctorName === option.value.doctorName
        );
        let timings = [];
        if (schedulesForDoctor.length > 0) {
          const allTimings = schedulesForDoctor.flatMap(s => s.time || []);
          timings = [...new Set(allTimings)];
        }
        
        const booked = bookedByDoctor[option.value.doctorName] || [];

        if (timings.length > 0) {
          const timingOptions = timings.map(t => ({ 
            label: t, 
            value: t,
            disabled: booked.includes(t)
          }));
          addBotMessage("Now select an available time.\n\nநேரத்தை தேர்வு செய்யவும்.", timingOptions);
        } else {
          addBotMessage("Sorry, no slots are available for this doctor.\n\nமன்னிக்கவும், இந்த மருத்துவருக்கு நேரம் இல்லை.", [{label: 'Select another doctor', value: 'reselect_doctor'}]);
          setCurrentStep('category'); 
        }
      } else if (currentStep === 'time') {
        setFormData(prev => ({ ...prev, time: option.value }));
        setCurrentStep('confirm');
        addBotMessage("Your details have been collected. Confirm Booking?\n\nஉங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன. முன்பதிவை உறுதி செய்யவா?", [
          { label: 'Confirm Booking / உறுதி செய்', value: 'confirm' },
          { label: 'Cancel / ரத்து செய்', value: 'cancel' }
        ]);
      } else if (currentStep === 'confirm') {
        if (option.value === 'confirm') {
          submitBooking();
        } else {
          addBotMessage("Booking Cancelled. Say 'Hi' to start again.\n\nமுன்பதிவு ரத்து செய்யப்பட்டது. மீண்டும் தொடங்க 'Hi' என்று அனுப்பவும்.");
          setCurrentStep('start');
        }
      }
    }, 500);
  };

  const handleDateConfirm = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      addUserMessage(formatDate(selectedDate));
      setFormData(prev => ({ ...prev, date: selectedDate }));
      setCurrentStep('category');
      fetchSchedulesForDate(selectedDate);
    }
  };

  const submitBooking = async () => {
    addBotMessage("Processing your booking... Please wait.\n\nஉங்கள் முன்பதிவு செயலாக்கப்படுகிறது...");
    
    const payload = {
      patient_name: formData.patientName,
      patient_age: formData.age,
      patient_gender: formData.gender,
      whatsapp_number: formData.whatsapp,
      login_mobile: user?.contactNumber || user?.mobile || "N/A",
      treatment_category: formData.category ? formData.category.originalName : "General",
      doctor_name: formData.doctor ? formData.doctor.doctorName : "N/A",
      appointment_date: formatDate(formData.date),
      appointment_time: formData.time,
      video_call: "No",
    };

    try {
      const response = await axios.post(`${BASE_URL}/api/emails/book`, payload);
      if (response.status === 200 || response.data.message) {
        addBotMessage("✅ Appointment Request Sent Successfully!\n\nஉங்கள் முன்பதிவு கோரிக்கை அனுப்பப்பட்டது.");
        setTimeout(() => {
          navigation.navigate('Dashboard');
        }, 3000);
      }
    } catch (error) {
      addBotMessage("❌ Booking failed. Please try again later.\n\nமுன்பதிவு தோல்வியடைந்தது.");
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageWrapper, item.isBot ? styles.messageWrapperBot : styles.messageWrapperUser]}>
      {item.isBot && (
        <View style={styles.botIconContainer}>
          <Icon name="face-agent" size={18} color="#E74C3C" />
        </View>
      )}
      <View style={item.isBot ? styles.messageBubbleBot : styles.messageBubbleUser}>
        <Text style={item.isBot ? styles.messageTextBot : styles.messageTextUser}>{item.text}</Text>
        
        {item.options && item.options.length > 0 && (
          <View style={styles.optionsContainer}>
            {item.options.map((opt, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.optionButton, opt.disabled && styles.optionButtonDisabled]} 
                onPress={() => handleOptionSelect(opt, item.id)}
                disabled={opt.disabled}
              >
                <Text style={[styles.optionText, opt.disabled && styles.optionTextDisabled]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="arrow-left" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Voice Booking / குரல் பதிவு</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
      />

      {loadingOptions && (
        <ActivityIndicator size="large" color="#E74C3C" style={{ marginBottom: 20 }} />
      )}

      {showDatePicker && (
        <DateTimePicker
          value={formData.date || new Date()}
          mode="date"
          display="default"
          onChange={handleDateConfirm}
          minimumDate={new Date()}
        />
      )}

      <View style={styles.voiceControls}>
        <Text style={styles.recognizedText}>
          {recognizedText ? `"${recognizedText}"` : (isListening ? "Listening... / கேட்கிறது..." : "Tap to Speak / பேச அழுத்தவும்")}
        </Text>
        
        <TouchableOpacity 
          onPress={isListening ? stopListening : startListening} 
          style={[styles.bigMicButton, isListening && styles.bigMicButtonActive]}>
          <Icon name={isListening ? "microphone" : "microphone-outline"} size={40} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1A1A2E' },
  header: {
    padding: 15,
    backgroundColor: '#E74C3C',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  chatContainer: { padding: 15, paddingBottom: 100 },
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  botIconContainer: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8, backgroundColor: '#FFF'
  },
  messageBubbleBot: {
    backgroundColor: '#2A2A40', padding: 15, borderRadius: 20,
    borderBottomLeftRadius: 0, maxWidth: '80%', elevation: 2
  },
  messageBubbleUser: {
    backgroundColor: '#E74C3C', padding: 15, borderRadius: 20,
    borderBottomRightRadius: 0, maxWidth: '80%',
  },
  messageTextBot: { fontSize: 15, color: '#FFF', lineHeight: 22 },
  messageTextUser: { fontSize: 15, color: '#FFF', lineHeight: 22 },
  optionsContainer: { marginTop: 10, width: '100%' },
  optionButton: {
    backgroundColor: '#FFF', borderRadius: 20,
    paddingVertical: 12, paddingHorizontal: 15, marginTop: 8, alignItems: 'center'
  },
  optionButtonDisabled: { backgroundColor: '#555' },
  optionText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  optionTextDisabled: { color: '#999' },
  voiceControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: 'rgba(26, 26, 46, 0.95)',
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333'
  },
  recognizedText: { color: '#FFF', fontSize: 16, marginBottom: 15, fontStyle: 'italic' },
  bigMicButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#E74C3C', shadowOpacity: 0.5, shadowRadius: 10
  },
  bigMicButtonActive: {
    backgroundColor: '#ff3333',
    transform: [{ scale: 1.1 }]
  }
});

export default VoiceBookingScreen;
