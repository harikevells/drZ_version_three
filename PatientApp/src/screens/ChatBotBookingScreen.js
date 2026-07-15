import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  Platform, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Dimensions, PermissionsAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const IP_ADDRESS = '10.10.11.90'; 
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const { width } = Dimensions.get('window');

const ChatBotBookingScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?',
      isBot: true,
      options: [{ label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }],
    }
  ]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const mobile = user?.contactNumber || user?.mobile || "N/A";
        const historyJson = await AsyncStorage.getItem(`chatHistory_${mobile}`);
        if (historyJson) {
          const history = JSON.parse(historyJson);
          const cleanedHistory = history.map(m => ({ ...m, options: [] }));
          setMessages([
            ...cleanedHistory,
            {
              id: Date.now().toString(),
              text: 'Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?',
              isBot: true,
              options: [{ label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }],
            }
          ]);
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    const saveHistory = async () => {
      try {
        const mobile = user?.contactNumber || user?.mobile || "N/A";
        if (messages.length > 1) {
          await AsyncStorage.setItem(`chatHistory_${mobile}`, JSON.stringify(messages));
        }
      } catch (e) {
        console.error("Error saving chat history:", e);
      }
    };
    saveHistory();
  }, [messages, user]);

  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('none'); // 'text', 'options', 'date', 'none'
  const [currentStep, setCurrentStep] = useState('start'); 
  const currentStepRef = useRef(currentStep);
  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  
  useEffect(() => {
    Tts.getInitStatus().then(() => {
      Tts.setDefaultRate(0.5);
      Tts.setDefaultPitch(1.0);
      Tts.setDefaultLanguage('ta-IN').catch(e => console.log('Language ta-IN not supported'));
      
      // AI speaks greeting and the option button as soon as chat opens
      Tts.speak('Hi, I am Your Doctor Z AI Assistant. How Can I Help You Today? வணக்கம், நான் உங்கள் Doctor Z AI உதவியாளர். உங்களுக்கு எப்படி உதவலாம்? Book an appointment. சந்திப்பை முன்பதிவு செய்யவும்.');
    }).catch((err) => {
      if (err.code === 'no_engine') {
        Tts.requestInstallEngine();
      }
    });
    
    return () => {
      Tts.stop();
    };
  }, []);

  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      console.log("Speech error (this is normal if no speech is detected):", e);
      setIsListening(false);
      setInputText('');
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInputText(e.value[0]);
      }
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setInputText(text);
        Voice.stop();
        setIsListening(false);
        
        // Auto-send the voice message after 500ms so user can see it
        setTimeout(() => {
          if (!text.trim()) return;
          setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot: false }]);
          setInputText('');
          setInputMode('none');

          setTimeout(() => {
            const step = currentStepRef.current;
            if (step === 'name') {
              setFormData(prev => ({ ...prev, patientName: text }));
              setCurrentStep('age');
              addBotMessage("How old are you?\n\nஉங்கள் வயதை உள்ளிடவும்.");
              setInputMode('text');
            } else if (step === 'age') {
              setFormData(prev => ({ ...prev, age: text }));
              setCurrentStep('gender');
              addBotMessage("Please Select your gender.\n\nபாலினத்தை தேர்வு செய்யவும்.", [
                { label: 'Male / ஆண்', value: 'Male' },
                { label: 'Female / பெண்', value: 'Female' },
                { label: 'Others / மற்றவை', value: 'Others' }
              ], 'options');
            } else if (step === 'whatsapp') {
              setFormData(prev => ({ ...prev, whatsapp: text }));
              setCurrentStep('date');
              addBotMessage("Please Select a Date\n\nதேதியை தேர்வு செய்யவும்.");
              setInputMode('date');
            } else if (step === 'start') {
              addBotMessage("Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?", [
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
      setTimeout(async () => {
        await Voice.start('en-IN'); 
      }, 100);
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
  const [doctorList, setDoctorList] = useState([]);
  const [availableTimings, setAvailableTimings] = useState([]);
  const [bookedByDoctor, setBookedByDoctor] = useState({});
  const [dateSchedules, setDateSchedules] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, inputMode, doctorCategories, doctorList, availableTimings]);

  const addBotMessage = (text, options = [], type = 'text', customData = null) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot: true, options, type, customData }]);
    
    // Make the AI speak the entire message
    Tts.stop();
    
    let textToSpeak = text.replace(/\n/g, ' ').replace(/DrZ/gi, 'Doctor Z');
    
    // If there are buttons/options, read them out loud too!
    if (options && options.length > 0) {
      const optionsText = options.map(opt => opt.label.replace(/\n/g, ' ')).join('. ');
      textToSpeak += '. ' + optionsText;
    }
    
    Tts.speak(textToSpeak);
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
      setAllDoctors(liveDoctorsData);

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
      const formattedCategories = departments.map((cat, index) => {
        return { 
          _id: String(index + 1), 
          label: cat, 
          value: cat,
          originalName: cat.split('/')[0].trim(),
          fullDepartment: cat
        };
      });
      setDoctorCategories(formattedCategories);
      
      if (formattedCategories.length > 0) {
        addBotMessage("Now, Select your treatment category you need.\n\nதேவையான சிகிச்சையை தேர்வு செய்யவும்.", formattedCategories, 'options');
      } else {
        addBotMessage("No available categories on this date. Please select another date.\n\nஇந்த தேதியில் மருத்துவர்கள் இல்லை. வேறு தேதியை தேர்வு செய்யவும்.");
        setInputMode('date');
        setCurrentStep('date');
      }
      
    } catch (error) {
      console.log("Error fetching schedules", error);
      addBotMessage("Error fetching data. Please try again.");
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    addUserMessage(text);
    setInputText('');
    setInputMode('none');

    setTimeout(() => {
      if (currentStep === 'name') {
        setFormData(prev => ({ ...prev, patientName: text }));
        setCurrentStep('age');
        addBotMessage("How old are you?\n\nஉங்கள் வயதை உள்ளிடவும்.");
        setInputMode('text');
      } else if (currentStep === 'age') {
        setFormData(prev => ({ ...prev, age: text }));
        setCurrentStep('gender');
        addBotMessage("Please Select your gender.\n\nபாலினத்தை தேர்வு செய்யவும்.", [
          { label: 'Male / ஆண்', value: 'Male' },
          { label: 'Female / பெண்', value: 'Female' },
          { label: 'Others / மற்றவை', value: 'Others' }
        ], 'options');
      } else if (currentStep === 'whatsapp') {
        setFormData(prev => ({ ...prev, whatsapp: text }));
        setCurrentStep('date');
        addBotMessage("Please Select a Date\n\nதேதியை தேர்வு செய்யவும்.");
        setInputMode('date');
      } else if (currentStep === 'start') {
        addBotMessage('Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?', [{ label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }]);
      }
    }, 500);
  };

  const handleOptionSelect = (option, msgId) => {
    // Hide options from the message that was just interacted with
    setMessages(prev => prev.map(msg => msg.id === msgId ? { ...msg, options: [] } : msg));
    addUserMessage(option.label.split('\n')[0]);
    setInputMode('none');

    setTimeout(() => {
      if (currentStep === 'start' && option.value === 'book_appointment') {
        setCurrentStep('name');
        addBotMessage("Sure! Let's get started.\nWhat is your full name?\n\nசரி, ஆரம்பிக்கலாம். உங்கள் முழு பெயர் என்ன?");
        setInputMode('text');
      } else if (currentStep === 'gender') {
        setFormData(prev => ({ ...prev, gender: option.value }));
        setCurrentStep('whatsapp');
        addBotMessage("Great! Now, please share your whatsapp number.\n\nஅற்புதம்! இப்போது உங்கள் WhatsApp எண்ணை பகிரவும்.");
        setInputMode('text');
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
          addBotMessage("Please select a Doctor\n\nமருத்துவரை தேர்வு செய்யவும்.", formattedDoctors, 'options');
        } else {
          addBotMessage("No available doctors for this category. Please select another category.\n\nஇந்த பிரிவில் மருத்துவர்கள் இல்லை. வேறு பிரிவை தேர்வு செய்யவும்.", doctorCategories, 'options');
          setCurrentStep('category');
        }
      } else if (currentStep === 'doctor') {
        setFormData(prev => ({ ...prev, doctor: option.value }));
        setCurrentStep('time');
        
        // Find timings
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
          addBotMessage("Now select an available time.\n\nநேரத்தை தேர்வு செய்யவும்.", timingOptions, 'options');
        } else {
          addBotMessage("Sorry, no slots are available for this doctor.\n\nமன்னிக்கவும், இந்த மருத்துவருக்கு நேரம் இல்லை.", [{label: 'Select another doctor', value: 'reselect_doctor'}], 'options');
          setCurrentStep('category'); 
        }
      } else if (currentStep === 'time') {
        setFormData(prev => ({ ...prev, time: option.value }));
        setCurrentStep('confirm');
        addBotMessage("Your details have been collected. Confirm Booking?\n\nஉங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன. முன்பதிவை உறுதி செய்யவா?", [
          { label: 'Confirm Booking / உறுதி செய்', value: 'confirm' },
          { label: 'Cancel / ரத்து செய்', value: 'cancel' }
        ], 'options');
      } else if (currentStep === 'confirm') {
        if (option.value === 'confirm') {
          submitBooking();
        } else {
          addBotMessage("Booking Cancelled. Say 'Hi' to start again.\n\nமுன்பதிவு ரத்து செய்யப்பட்டது. மீண்டும் தொடங்க 'Hi' என்று அனுப்பவும்.");
          setCurrentStep('start');
          setInputMode('text');
        }
      }
    }, 500);
  };

  const handleDateConfirm = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      addUserMessage(formatDate(selectedDate));
      setFormData(prev => ({ ...prev, date: selectedDate }));
      setInputMode('none');
      setCurrentStep('category');
      fetchSchedulesForDate(selectedDate);
    } else {
      setInputMode('date');
    }
  };

  const submitBooking = async () => {
    setSendingEmail(true);
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
        addBotMessage("✅ Appointment Request Sent Successfully!\nஉங்கள் முன்பதிவு கோரிக்கை அனுப்பப்பட்டது.");
        setTimeout(() => {
          navigation.navigate('Dashboard');
        }, 2000);
      }
    } catch (error) {
      addBotMessage("❌ Booking failed. Please try again later.");
    } finally {
      setSendingEmail(false);
    }
  };

  const renderMessage = ({ item }) => {
    return (
      <View style={[styles.messageWrapper, item.isBot ? styles.messageWrapperBot : styles.messageWrapperUser]}>
        {item.isBot && (
          <View style={styles.botIconContainer}>
            <Icon name="lightning-bolt" size={18} color="#007BFF" />
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
        {!item.isBot && (
          <View style={styles.userIconContainer}>
            <Icon name="account-outline" size={20} color="#999" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="arrow-left" size={24} color="#333" />
          <Text style={styles.headerTitle}>Chat Bot / AI உதவியாளர்</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
        />

        {loadingOptions && (
          <View style={{ padding: 10, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#1C3E55" />
          </View>
        )}

        {inputMode === 'date' && (
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={24} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 10, fontWeight: 'bold' }}>Pick a Date</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.date || new Date()}
                mode="date"
                display="default"
                onChange={handleDateConfirm}
                minimumDate={new Date()}
              />
            )}
          </View>
        )}

        {inputMode === 'text' && (
          <View style={styles.inputContainer}>
            <TouchableOpacity 
              onPress={isListening ? stopListening : startListening} 
              style={[styles.micButton, isListening && styles.micButtonActive, { marginLeft: 0, marginRight: 10 }]}>
              <Icon name={isListening ? "microphone-off" : "microphone"} size={20} color="#fff" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#000"
              value={inputText}
              onChangeText={setInputText}
              keyboardType={currentStep === 'age' || currentStep === 'whatsapp' ? 'numeric' : 'default'}
            />
            <TouchableOpacity onPress={handleSendText} style={styles.sendButton}>
              <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  botIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
    backgroundColor: '#fff'
  },
  userIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 2,
    backgroundColor: '#fff'
  },
  messageBubbleBot: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    borderTopLeftRadius: 0,
    maxWidth: '80%',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  messageBubbleUser: {
    backgroundColor: '#E6F4FE',
    padding: 12,
    borderRadius: 15,
    borderTopRightRadius: 0,
    maxWidth: '80%',
  },
  messageTextBot: { fontSize: 14, color: '#333', lineHeight: 22, textAlign: 'left' },
  messageTextUser: { fontSize: 14, color: '#1C3E55', lineHeight: 22, textAlign: 'left' },
  optionsContainer: { marginTop: 10, width: '100%' },
  optionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 8,
    alignItems: 'center'
  },
  optionButtonDisabled: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5'
  },
  optionText: { color: '#1C3E55', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  optionTextDisabled: {
    color: '#ff4444'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#F5F7FA',
    borderRadius: 25,
    paddingHorizontal: 15,
    color: '#333',
  },
  sendButton: {
    width: 45,
    height: 45,
    backgroundColor: '#1C3E55',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  micButton: {
    width: 45,
    height: 45,
    backgroundColor: '#007BFF',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  micButtonActive: {
    backgroundColor: '#ff4444',
  },
  datePickerBtn: {
    flex: 1,
    backgroundColor: '#1C3E55',
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default ChatBotBookingScreen;
