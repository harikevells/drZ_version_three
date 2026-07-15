import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  Platform, ActivityIndicator, TextInput, KeyboardAvoidingView, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'http://10.10.11.90:5000/api';

const { width } = Dimensions.get('window');

const ChatBotBookingScreen = () => {
  const navigation = useNavigation<any>();
  const flatListRef = useRef<FlatList>(null);
  const [userMobile, setUserMobile] = useState("N/A");

  useEffect(() => {
    AsyncStorage.getItem('userData').then(data => {
      if (data) {
        const u = JSON.parse(data);
        setUserMobile(u.mobile || u.contactNumber || "N/A");
      }
    });
  }, []);

  const [messages, setMessages] = useState<any[]>([
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
        if (userMobile === "N/A") return;
        const historyJson = await AsyncStorage.getItem(`chatHistory_${userMobile}`);
        if (historyJson) {
          const history = JSON.parse(historyJson);
          const cleanedHistory = history.map((m: any) => ({ ...m, options: [] }));
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
  }, [userMobile]);

  useEffect(() => {
    const saveHistory = async () => {
      try {
        if (userMobile === "N/A") return;
        if (messages.length > 1) {
          await AsyncStorage.setItem(`chatHistory_${userMobile}`, JSON.stringify(messages));
        }
      } catch (e) {
        console.error("Error saving chat history:", e);
      }
    };
    saveHistory();
  }, [messages, userMobile]);

  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'options' | 'date' | 'none'>('none'); 
  const [currentStep, setCurrentStep] = useState('start'); 
  
  const [formData, setFormData] = useState<any>({
    patientName: '',
    age: '',
    gender: '',
    whatsapp: '',
    category: null,
    doctor: null,
    date: new Date(),
    time: ''
  });

  const [doctorCategories, setDoctorCategories] = useState<any[]>([]);
  const [availableDoctorsForDate, setAvailableDoctorsForDate] = useState<any[]>([]);
  const [dateSchedules, setDateSchedules] = useState<any[]>([]);
  const [bookedByDoctor, setBookedByDoctor] = useState<any>({});
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages, inputMode, doctorCategories]);

  const addBotMessage = (text: string, options: any[] = [], type = 'text', customData = null) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot: true, options, type, customData }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isBot: false }]);
  };

  const formatDate = (rawDate: Date) => { 
    const d = new Date(rawDate); 
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day} / ${month} / ${d.getFullYear()}`; 
  };

  const fetchSchedulesForDate = async (selectedDate: Date) => {
    setLoadingOptions(true);
    try {
      const d = new Date(selectedDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const formattedDateForSchedules = `${year}-${month}-${day}`;
      const formattedDateForAppointments = formatDate(selectedDate);

      const [schedulesRes, appointmentsRes, doctorsRes] = await Promise.all([
        axios.get(`${API_URL}/schedules?date=${formattedDateForSchedules}`),
        axios.get(`${API_URL}/emails/booked-timings?appointment_date=${formattedDateForAppointments}`),
        axios.get(`${API_URL}/doctors`)
      ]);

      const liveDoctorsData = doctorsRes.data || [];

      const approvedSchedules = schedulesRes.data.filter((s: any) => {
         if (s.status !== 'Approved') return false;
         return liveDoctorsData.some((doc: any) => 
            (doc._id === s.doctorId || doc.id === s.doctorId) || 
            (doc.doctorName === s.doctorName)
         );
      });
      setDateSchedules(approvedSchedules);

      const appointments = appointmentsRes.data || [];
      const bookedMap: any = {};
      appointments.forEach((app: any) => {
         if (!bookedMap[app.doctor_name]) bookedMap[app.doctor_name] = [];
         bookedMap[app.doctor_name].push(app.appointment_time);
      });
      setBookedByDoctor(bookedMap);

      const activeDocsWithSchedules = liveDoctorsData.filter((doc: any) => 
         approvedSchedules.some((s: any) => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
      );
      setAvailableDoctorsForDate(activeDocsWithSchedules);

      const uniqueDepts = new Set<string>();
      activeDocsWithSchedules.forEach((doc: any) => {
        if (doc.department) {
           doc.department.split(',').forEach((dep: string) => {
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
        addBotMessage("Now, Select your treatment category you need.\nதேவையான சிகிச்சையை தேர்வு செய்யவும்.", formattedCategories, 'options');
      } else {
        addBotMessage("No available categories on this date. Please select another date.\nஇந்த தேதியில் மருத்துவர்கள் இல்லை. வேறு தேதியை தேர்வு செய்யவும்.");
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
        setFormData((prev: any) => ({ ...prev, patientName: text }));
        setCurrentStep('age');
        addBotMessage("How old are you?\nஉங்கள் வயதை உள்ளிடவும்.");
        setInputMode('text');
      } else if (currentStep === 'age') {
        setFormData((prev: any) => ({ ...prev, age: text }));
        setCurrentStep('gender');
        addBotMessage("Please Select your gender.\nபாலினத்தை தேர்வு செய்யவும்.", [
          { label: 'Male / ஆண்', value: 'Male' },
          { label: 'Female / பெண்', value: 'Female' },
          { label: 'Others / மற்றவை', value: 'Others' }
        ], 'options');
      } else if (currentStep === 'whatsapp') {
        setFormData((prev: any) => ({ ...prev, whatsapp: text }));
        setCurrentStep('date');
        addBotMessage("Please Select a Date\nதேதியை தேர்வு செய்யவும்.");
        setInputMode('date');
      } else if (currentStep === 'start') {
        addBotMessage('Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?', [{ label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }]);
      }
    }, 500);
  };

  const handleOptionSelect = (option: any, msgId: string) => {
    setMessages(prev => prev.map(msg => msg.id === msgId ? { ...msg, options: [] } : msg));
    addUserMessage(option.label.split('\n')[0]);
    setInputMode('none');

    setTimeout(() => {
      if (currentStep === 'start' && option.value === 'book_appointment') {
        setCurrentStep('name');
        addBotMessage("Sure! Let's get started.\nWhat is your full name?\nசரி, ஆரம்பிக்கலாம். உங்கள் முழு பெயர் என்ன?");
        setInputMode('text');
      } else if (currentStep === 'gender') {
        setFormData((prev: any) => ({ ...prev, gender: option.value }));
        setCurrentStep('whatsapp');
        addBotMessage("Great! Now, please share your whatsapp number.\nஅற்புதம்! இப்போது உங்கள் WhatsApp எண்ணை பகிரவும்.");
        setInputMode('text');
      } else if (currentStep === 'category') {
        const docsForCategory = availableDoctorsForDate.filter(doc => {
          if (!doc.department) return option.originalName === 'Others';
          const depts = doc.department.split(',').map((cat: string) => cat.trim());
          return depts.includes(option.fullDepartment);
        });
        const formattedDoctors = docsForCategory.map(doc => ({
           _id: doc._id || doc.id,
           label: doc.doctorName + " / " + (doc.experience ? doc.experience + " Yrs" : ""),
           value: doc,
        }));
        
        if (formattedDoctors.length > 0) {
          setFormData((prev: any) => ({ ...prev, category: option }));
          setCurrentStep('doctor');
          addBotMessage("Please select a Doctor\nமருத்துவரை தேர்வு செய்யவும்.", formattedDoctors, 'options');
        } else {
          addBotMessage("No available doctors for this category. Please select another category.\nஇந்த பிரிவில் மருத்துவர்கள் இல்லை. வேறு பிரிவை தேர்வு செய்யவும்.", doctorCategories, 'options');
          setCurrentStep('category');
        }
      } else if (currentStep === 'doctor') {
        setFormData((prev: any) => ({ ...prev, doctor: option.value }));
        setCurrentStep('time');
        
        const schedulesForDoctor = dateSchedules.filter(s => 
          s.doctorId === option.value._id || 
          s.doctorId === option.value.id || 
          s.doctorName === option.value.doctorName
        );
        let timings: string[] = [];
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
          addBotMessage("Now select an available time.\nநேரத்தை தேர்வு செய்யவும்.", timingOptions, 'options');
        } else {
          addBotMessage("Sorry, no slots are available for this doctor.", [{label: 'Select another doctor', value: 'reselect_doctor'}], 'options');
          setCurrentStep('category'); 
        }
      } else if (currentStep === 'time') {
        setFormData((prev: any) => ({ ...prev, time: option.value }));
        setCurrentStep('confirm');
        addBotMessage("Your details have been collected. Confirm Booking?\nஉங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன. முன்பதிவை உறுதி செய்யவா?", [
          { label: 'Confirm Booking / உறுதி செய்', value: 'confirm' },
          { label: 'Cancel / ரத்து செய்', value: 'cancel' }
        ], 'options');
      } else if (currentStep === 'confirm') {
        if (option.value === 'confirm') {
          submitBooking();
        } else {
          addBotMessage("Booking Cancelled. Say 'Hi' to start again.\nமுன்பதிவு ரத்து செய்யப்பட்டது. மீண்டும் தொடங்க 'Hi' என்று அனுப்பவும்.");
          setCurrentStep('start');
          setInputMode('text');
        }
      }
    }, 500);
  };

  const handleDateConfirm = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      addUserMessage(formatDate(selectedDate));
      setFormData((prev: any) => ({ ...prev, date: selectedDate }));
      setInputMode('none');
      setCurrentStep('category');
      fetchSchedulesForDate(selectedDate);
    } else {
      setInputMode('date');
    }
  };

  const submitBooking = async () => {
    addBotMessage("Processing your booking... Please wait.\nஉங்கள் முன்பதிவு செயலாக்கப்படுகிறது...");
    
    const payload = {
      patient_name: formData.patientName,
      patient_age: formData.age,
      patient_gender: formData.gender,
      whatsapp_number: formData.whatsapp,
      login_mobile: userMobile,
      treatment_category: formData.category ? formData.category.originalName : "General",
      doctor_name: formData.doctor ? formData.doctor.doctorName : "N/A",
      appointment_date: formatDate(formData.date),
      appointment_time: formData.time,
      video_call: "No",
    };

    try {
      const response = await axios.post(`${API_URL}/emails/book`, payload);
      if (response.status === 200 || response.data.message) {
        addBotMessage("✅ Appointment Request Sent Successfully!\nஉங்கள் முன்பதிவு கோரிக்கை அனுப்பப்பட்டது.");
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      addBotMessage("❌ Booking failed. Please try again later.");
    }
  };

  const renderMessage = ({ item }: any) => {
    return (
      <View style={[styles.messageWrapper, item.isBot ? styles.messageWrapperBot : styles.messageWrapperUser]}>
        {item.isBot && (
          <View style={styles.botIconContainer}>
            <Ionicons name="flash" size={18} color="#007BFF" />
          </View>
        )}
        <View style={item.isBot ? styles.messageBubbleBot : styles.messageBubbleUser}>
          <Text style={item.isBot ? styles.messageTextBot : styles.messageTextUser}>{item.text}</Text>
          
          {item.options && item.options.length > 0 && (
            <View style={styles.optionsContainer}>
              {item.options.map((opt: any, idx: number) => (
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
            <Ionicons name="person-outline" size={18} color="#666" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
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
            <ActivityIndicator size="small" color="#052A3F" />
          </View>
        )}

        {inputMode === 'date' && (
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={24} color="#fff" />
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
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor="#000"
              value={inputText}
              onChangeText={setInputText}
              keyboardType={currentStep === 'age' || currentStep === 'whatsapp' ? 'numeric' : 'default'}
            />
            <TouchableOpacity onPress={handleSendText} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
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
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
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
    backgroundColor: '#fff'
  },
  messageBubbleBot: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    maxWidth: '80%',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  messageBubbleUser: {
    backgroundColor: '#E6F4FE',
    padding: 12,
    borderRadius: 15,
    borderBottomRightRadius: 0,
    maxWidth: '80%',
  },
  messageTextBot: { fontSize: 14, color: '#333', lineHeight: 20 },
  messageTextUser: { fontSize: 14, color: '#052A3F', lineHeight: 20 },
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
  optionText: { color: '#052A3F', fontWeight: '600', fontSize: 13, textAlign: 'center' },
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
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 15,
    color: '#333',
  },
  sendButton: {
    width: 45,
    height: 45,
    backgroundColor: '#052A3F',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  datePickerBtn: {
    flex: 1,
    backgroundColor: '#052A3F',
    flexDirection: 'row',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default ChatBotBookingScreen;
