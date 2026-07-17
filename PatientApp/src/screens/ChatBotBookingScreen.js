import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Image,
  Platform, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Dimensions, PermissionsAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Calendar } from 'react-native-calendars';
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
    const loadState = async () => {
      try {
        const mobile = user?.contactNumber || user?.mobile || "N/A";
        const stateJson = await AsyncStorage.getItem(`chatState_${mobile}`);
        if (stateJson) {
          const state = JSON.parse(stateJson);
          setMessages(state.messages || []);
          setCurrentStep(state.currentStep || 'start');
          setInputMode(state.inputMode || 'none');
          if (state.formData) {
            setFormData({
               ...state.formData,
               date: state.formData.date ? new Date(state.formData.date) : new Date()
            });
          }
          setDoctorCategories(state.doctorCategories || []);
          setAvailableDoctorsForDate(state.availableDoctorsForDate || []);
          setDoctorList(state.doctorList || []);
          setAvailableTimings(state.availableTimings || []);
          setBookedByDoctor(state.bookedByDoctor || {});
          setDateSchedules(state.dateSchedules || []);
          setAllDoctors(state.allDoctors || []);
        }
      } catch (e) {
        console.error("Error loading chat state:", e);
      }
    };
    loadState();
  }, [user]);

  useEffect(() => {
    const saveState = async () => {
      try {
        const mobile = user?.contactNumber || user?.mobile || "N/A";
        if (currentStep === 'start' && messages.length <= 1) return;
        
        const stateToSave = {
          messages, currentStep, inputMode, formData,
          doctorCategories, availableDoctorsForDate, doctorList,
          availableTimings, bookedByDoctor, dateSchedules, allDoctors
        };
        await AsyncStorage.setItem(`chatState_${mobile}`, JSON.stringify(stateToSave));
      } catch (e) {
        console.error("Error saving chat state:", e);
      }
    };
    saveState();
  }, [messages, currentStep, inputMode, formData, doctorCategories, availableDoctorsForDate, doctorList, availableTimings, bookedByDoctor, dateSchedules, allDoctors, user]);

  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('none'); // 'text', 'options', 'date', 'none'
  const [currentStep, setCurrentStep] = useState('start'); 
  const [editingState, setEditingState] = useState(null); // { msgId, step }
  const currentStepRef = useRef(currentStep);
  const processUserInputRef = useRef(null);
  const inputTextRef = useRef(inputText);

  useEffect(() => { currentStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { processUserInputRef.current = processUserInput; });
  useEffect(() => { inputTextRef.current = inputText; }, [inputText]);
  
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
    let partialTimeoutId = null;
    
    Voice.onSpeechStart = () => setIsListening(true);
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      console.log("Speech error (this is normal if no speech is detected):", e);
      setIsListening(false);
      clearTimeout(partialTimeoutId);
    };
    
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setInputText(e.value[0]);
        
        // Force process if engine hangs on short words
        clearTimeout(partialTimeoutId);
        partialTimeoutId = setTimeout(() => {
           const currentText = e.value[0];
           if (currentText && currentText.trim() && processUserInputRef.current) {
               Voice.stop();
               setInputText('');
               processUserInputRef.current(currentText);
           }
        }, 4000);
      }
    };
    
    Voice.onSpeechResults = (e) => {
      clearTimeout(partialTimeoutId);
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        setInputText(text);
        Voice.stop();
        setIsListening(false);
        
        if (!text.trim()) return;
        if (processUserInputRef.current) processUserInputRef.current(text);
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
      try {
        await Voice.destroy();
      } catch (e) {}
      await Voice.start('en-IN');
      // Don't set isListening here immediately, wait for onSpeechStart!
      setInputText('');
    } catch (e) {
      console.error("Error starting voice:", e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      
      const text = inputTextRef.current;
      if (text && text.trim()) {
         setInputText('');
         if (processUserInputRef.current) {
             processUserInputRef.current(text);
         }
      }
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
    setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), text, isBot: true, options, type, customData }]);
    
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
    setMessages(prev => [...prev, { id: (Date.now() + Math.random()).toString(), text, isBot: false }]);
  };

  const formatDate = (rawDate) => { 
    const d = new Date(rawDate); 
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day} / ${month} / ${d.getFullYear()}`; 
  };

  const extractAgeText = (text) => {
    const t = text.toLowerCase().trim();
    const match = t.match(/\d+/);
    if (match) return match[0];
    
    const tens = {
        'twenty': 20, 'iruvathi': 20, 'irubathi': 20, 'irupathi': 20, 'patti': 20, 'iruvati': 20, 'irupati': 20, 'twanti': 20,
        'thirty': 30, 'muppathi': 30, 'mupathi': 30, 'muppati': 30, 'mupati': 30, 'thirti': 30,
        'forty': 40, 'naapathi': 40, 'naarpathi': 40, 'napati': 40, 'nappati': 40,
        'fifty': 50, 'ambathi': 50, 'aimbathi': 50, 'ambatti': 50, 'ambati': 50,
        'sixty': 60, 'arubathi': 60, 'aruvathi': 60, 'arubati': 60,
        'seventy': 70, 'elubathi': 70, 'eluvathi': 70, 'elubati': 70,
        'eighty': 80, 'enpathi': 80, 'enpati': 80,
        'ninety': 90, 'thonnutri': 90, 'thonnuru': 90
    };
    
    const units = {
        'one': 1, 'onnu': 1, 'on': 1, 'won': 1,
        'two': 2, 'rendu': 2, 'twoo': 2, 'too': 2,
        'three': 3, 'moonu': 3, 'muna': 3, 'tree': 3, 'thri': 3,
        'four': 4, 'naalu': 4, 'nal': 4, 'for': 4,
        'five': 5, 'anju': 5, 'aaenge': 5, 'ange': 5, 'and': 5, 'anji': 5, 'fiv': 5,
        'six': 6, 'aaru': 6, 'aru': 6,
        'seven': 7, 'ezhu': 7, 'ealu': 7, 'elu': 7, 'yelu': 7,
        'eight': 8, 'ettu': 8, 'etu': 8, 'ate': 8,
        'nine': 9, 'ombathu': 9, 'ombadu': 9, 'onbathu': 9,
        'ten': 10, 'pathu': 10, 'patu': 10,
        'eleven': 11, 'pathinonnu': 11,
        'twelve': 12, 'pannandu': 12, 'panandu': 12,
        'thirteen': 13, 'pathimoonu': 13,
        'fourteen': 14, 'pathinaalu': 14,
        'fifteen': 15, 'pathinanju': 15, 'pathinange': 15, 'pathinand': 15,
        'sixteen': 16, 'pathinaaru': 16,
        'seventeen': 17, 'pathinealu': 17, 'pathinelu': 17,
        'eighteen': 18, 'pathinettu': 18,
        'nineteen': 19, 'pathombathu': 19,
        'twenty': 20, 'iruvathu': 20, 'irupathu': 20, 'iruvatu': 20,
        'thirty': 30, 'muppathu': 30, 'mupatu': 30,
        'forty': 40, 'naappathu': 40, 'napatu': 40,
        'fifty': 50, 'ambathu': 50, 'ambatu': 50,
        'sixty': 60, 'arubathu': 60, 'arubatu': 60,
        'seventy': 70, 'elubathu': 70, 'elubatu': 70,
        'eighty': 80, 'enbathu': 80, 'enbatu': 80,
        'ninety': 90, 'thonnuru': 90
    };

    let total = 0;
    let found = false;
    
    const words = t.replace(/[^a-z0-9\s\u0B80-\u0BFF]/g, '').split(/\s+/);
    
    words.forEach(w => {
        if (tens[w]) {
            total += tens[w];
            found = true;
        } else if (units[w]) {
            total += units[w];
            found = true;
        }
    });
    
    if (found) return total.toString();
    
    // Explicit hallucination fallback
    if (t.includes('patti aaenge')) return '25';
    if (t.includes('ambatti and')) return '55';
    if (t.includes('ambathi anju')) return '55';
    
    return t; // return original if nothing found
  };

  const extractPhoneNumberText = (text) => {
    let t = text.toLowerCase().trim();
    const digitMatch = t.replace(/\D/g, '');
    if (digitMatch.length >= 10) return digitMatch.substring(0, 10);
    
    const numMap = {
        'zero': '0', 'poojiyam': '0', 'jiiro': '0', 'hero': '0', 'muttai': '0', '0': '0',
        'one': '1', 'onnu': '1', 'on': '1', 'won': '1', 'ondru': '1', '1': '1',
        'two': '2', 'rendu': '2', 'twoo': '2', 'too': '2', 'irandu': '2', '2': '2',
        'three': '3', 'moonu': '3', 'muna': '3', 'tree': '3', 'thri': '3', 'moondru': '3', '3': '3',
        'four': '4', 'naalu': '4', 'nal': '4', 'for': '4', 'naangu': '4', '4': '4',
        'five': '5', 'anju': '5', 'aaenge': '5', 'ange': '5', 'and': '5', 'anji': '5', 'fiv': '5', 'ainthu': '5', '5': '5',
        'six': '6', 'aaru': '6', 'aru': '6', '6': '6',
        'seven': '7', 'ezhu': '7', 'ealu': '7', 'elu': '7', 'yelu': '7', '7': '7',
        'eight': '8', 'ettu': '8', 'etu': '8', 'ate': '8', '8': '8',
        'nine': '9', 'ombathu': '9', 'ombadu': '9', 'onbathu': '9', '9': '9',
        
        'ten': '10', 'pathu': '10', 'patu': '10',
        'eleven': '11', 'pathinonnu': '11',
        'twelve': '12', 'pannandu': '12', 'panandu': '12',
        'thirteen': '13', 'pathimoonu': '13',
        'fourteen': '14', 'pathinaalu': '14',
        'fifteen': '15', 'pathinanju': '15', 'pathinange': '15', 'pathinand': '15',
        'sixteen': '16', 'pathinaaru': '16',
        'seventeen': '17', 'pathinealu': '17', 'pathinelu': '17',
        'eighteen': '18', 'pathinettu': '18',
        'nineteen': '19', 'pathombathu': '19',
        
        'iruvathu': '20', 'irupathu': '20', 'iruvatu': '20', 'twenty': '20',
        'iruvathi': '2', 'irubathi': '2', 'irupathi': '2', 'patti': '2', 'iruvati': '2', 'irupati': '2', 'twanti': '2',
        
        'muppathu': '30', 'mupatu': '30', 'thirty': '30',
        'muppathi': '3', 'mupathi': '3', 'muppati': '3', 'mupati': '3', 'thirti': '3',
        
        'naappathu': '40', 'napatu': '40', 'forty': '40',
        'naapathi': '4', 'naarpathi': '4', 'napati': '4', 'nappati': '4',
        
        'ambathu': '50', 'ambatu': '50', 'fifty': '50',
        'ambathi': '5', 'aimbathi': '5', 'ambatti': '5', 'ambati': '5',
        
        'arubathu': '60', 'arubatu': '60', 'sixty': '60',
        'arubathi': '6', 'aruvathi': '6', 'arubati': '6',
        
        'elubathu': '70', 'elubatu': '70', 'seventy': '70',
        'elubathi': '7', 'eluvathi': '7', 'elubati': '7',
        
        'enbathu': '80', 'enbatu': '80', 'eighty': '80',
        'enpathi': '8', 'enpati': '8',
        
        'thonnuru': '90', 'ninety': '90',
        'thonnutri': '9', 'thombathu': '9', 'thombathi': '9'
    };

    let result = '';
    const words = t.replace(/[^a-z0-9\s\u0B80-\u0BFF]/g, '').split(/\s+/);
    
    words.forEach(w => {
        if (numMap[w]) {
            result += numMap[w];
        } else if (w.match(/\d+/)) {
            result += w.match(/\d+/)[0];
        }
    });

    if (result.length > 0) return result;
    return t;
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
          label: `${index + 1}. ` + cat, 
          value: cat,
          originalName: cat.split('/')[0].trim(),
          fullDepartment: cat
        };
      });
      setDoctorCategories(formattedCategories);
      
      if (formattedCategories.length > 0) {
        addBotMessage("Now, Select your treatment category you need.\n\nதேவையான சிகிச்சையை தேர்வு செய்யவும்.", formattedCategories, 'options');
      } else {
        const msgId = (Date.now() + Math.random()).toString();
        setMessages(prev => [...prev, {
          id: msgId,
          text: "No available categories on this date. Please select another date.\n\nஇந்த தேதியில் மருத்துவர்கள் இல்லை. வேறு தேதியை தேர்வு செய்யவும்.",
          isBot: true,
          isCalendar: true
        }]);
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

  const processUserInput = (text) => {
    
    if (editingState) {
        // We are doing an in-place edit!
        const { step, msgId } = editingState;
        
        let processedText = text;
        if (step === 'age') {
            processedText = extractAgeText(text);
        } else if (step === 'whatsapp') {
            const waMatch = extractPhoneNumberText(text);
            const digitOnly = waMatch.replace(/\D/g, '');
            if (digitOnly.length > 0) processedText = digitOnly;
        }
        
        if (step === 'name') setFormData(f => ({ ...f, patientName: processedText }));
        else if (step === 'age') setFormData(f => ({ ...f, age: processedText }));
        else if (step === 'whatsapp') setFormData(f => ({ ...f, whatsapp: processedText }));
        
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: processedText } : m));
        setEditingState(null);
        setInputText('');
        
        // Restore input mode based on the actual currentStep
        if (currentStep === 'name' || currentStep === 'age' || currentStep === 'whatsapp') {
            setInputMode('text');
        } else if (currentStep === 'date') {
            setInputMode('date');
        } else {
            setInputMode('none');
        }
        return; // Stop further processing, keep chat history intact!
    }

    setInputText('');
    setInputMode('none');

    setMessages(prev => {
      const lastBotMsgWithOptions = prev.slice().reverse().find(m => m.isBot && m.options && m.options.length > 0);
      let matchedOption = null;
      let matchedMsgId = null;

      const lowerText = text.toLowerCase();
      const step = currentStepRef.current;
      
      if (step === 'start' && (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hai') || lowerText.includes('வணக்கம்') || lowerText.includes('book') || lowerText.includes('appointment') || lowerText.includes('முன்பதிவு') || lowerText.includes('munpathivu') || lowerText.includes('புக்') || lowerText.includes('அப்பாயின்'))) {
          matchedOption = { value: 'book_appointment', label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்' };
      } else if (lastBotMsgWithOptions) {
          if (step === 'confirm') {
            if (lowerText.includes('confirm') || lowerText.includes('yes') || lowerText.includes('ok') || lowerText.includes('உறுதி') || lowerText.includes('uruthi') || lowerText.includes('uruti') || lowerText.includes('uruthi sei') || lowerText.includes('கன்பார்ம்') || lowerText.includes('ஓகே') || lowerText.includes('எஸ்')) {
                matchedOption = lastBotMsgWithOptions.options.find(o => o.value === 'confirm');
            } else if (lowerText.includes('cancel') || lowerText.includes('no') || lowerText.includes('ரத்து') || lowerText.includes('rathu') || lowerText.includes('raththu') || lowerText.includes('raat se') || lowerText.includes('rath se') || lowerText.includes('raat') || lowerText.includes('rathu sei') || lowerText.includes('கேன்சல்') || lowerText.includes('நோ')) {
                matchedOption = lastBotMsgWithOptions.options.find(o => o.value === 'cancel');
            }
        } else if (step === 'gender') {
            if (/\b(female|பெண்|pen|pain|pin|ben|pan|ten|when|then|spend|pent|tent|spin|பீமேல்|email|pombala|pombale|ponnu|girl|women|woman)\b/i.test(lowerText) || lowerText.includes('பெண்') || lowerText.includes('பீமேல்') || lowerText.includes('female')) {
                matchedOption = lastBotMsgWithOptions.options.find(o => o.value === 'Female');
            } else if (/\b(male|ஆண்|aan|on|an|and|aen|earn|arm|all|am|aah|hand|own|awe|haan|han|aahn|aand|மேல்|மெயில்|mail|mile|ambala|aambala|payan|paiyan|boy|man|men)\b/i.test(lowerText) || lowerText.includes('ஆண்') || lowerText.includes('மேல்') || lowerText.includes('male')) {
                matchedOption = lastBotMsgWithOptions.options.find(o => o.value === 'Male');
            } else if (/\b(other|others|மற்றவை|matravai|அதர்ஸ்)\b/i.test(lowerText) || lowerText.includes('மற்றவை') || lowerText.includes('other')) {
                matchedOption = lastBotMsgWithOptions.options.find(o => o.value === 'Others');
            }

            if (!matchedOption) {
                const wordToNum = { 
                  'one':'1', 'onnu':'1', 'on':'1', 'won':'1', 'first':'1',
                  'two':'2', 'rendu':'2', 'twoo':'2', 'too':'2', 'second':'2',
                  'three':'3', 'moonu':'3', 'muna':'3', 'tree':'3', 'thri':'3', 'third':'3'
                };
                let spokenText = lowerText.replace(/^(select|choose|click|press|option|number|the)\s+/gi, '').trim();
                let spokenNumber = wordToNum[spokenText] || spokenText;
                
                matchedOption = lastBotMsgWithOptions.options.find((opt, idx) => {
                    return String(idx + 1) === spokenNumber || opt.label.match(/^(\d+)\.\s*/)?.[1] === spokenNumber;
                });
            }
        } else {
            // Check if text matches option label
            matchedOption = lastBotMsgWithOptions.options.find((opt, idx) => {
                const lbl = opt.label.toLowerCase();
                
                // Generic number matching (if user says "1", "one", "first", "select one" etc.)
                const wordToNum = { 
                  'one':'1', 'onnu':'1', 'on':'1', 'won':'1', 'first':'1',
                  'two':'2', 'rendu':'2', 'twoo':'2', 'too':'2', 'second':'2',
                  'three':'3', 'moonu':'3', 'muna':'3', 'tree':'3', 'thri':'3', 'third':'3',
                  'four':'4', 'naalu':'4', 'nal':'4', 'for':'4', 'fourth':'4',
                  'five':'5', 'anju':'5', 'aaenge':'5', 'ange':'5', 'and':'5', 'anji':'5', 'fiv':'5', 'fifth':'5',
                  'six':'6', 'aaru':'6', 'aru':'6', 'sixth':'6',
                  'seven':'7', 'ezhu':'7', 'ealu':'7', 'elu':'7', 'yelu':'7', 'seventh':'7',
                  'eight':'8', 'ettu':'8', 'etu':'8', 'ate':'8', 'eighth':'8',
                  'nine':'9', 'ombathu':'9', 'ombadu':'9', 'onbathu':'9', 'ninth':'9',
                  'ten':'10', 'pathu':'10', 'patu':'10', 'tenth':'10'
                };
                let spokenText = lowerText.replace(/^(select|choose|click|press|option|number|the)\s+/gi, '').trim();
                let spokenNumber = wordToNum[spokenText] || spokenText;
                
                // Check if they said the exact index (e.g., "1" for 1st option)
                if (String(idx + 1) === spokenNumber) {
                    return true;
                }
                
                const indexMatch = lbl.match(/^(\d+)\.\s*/);
                if (indexMatch && indexMatch[1] === spokenNumber) {
                    return true;
                }

                const primaryWord = lbl.split(' / ')[0]?.trim() || '';
                const secondaryWord = lbl.split(' / ')[1]?.trim() || '';
                
                // Extra check for doctor names (ignore 'dr.', 'dr ' and numeric prefixes like '1. ')
                let cleanPrimary = primaryWord.replace(/^dr\.\s*/i, '').replace(/^dr\s*/i, '').replace(/^\d+\.\s*/, '').trim();
                
                let translatedText = lowerText;
                if (step === 'category') {
                    const translationMap = {
                      'idhaya': 'cardiology', 'heart': 'cardiology',
                      'pal': 'dental', 'pallu': 'dental', 'dentist': 'dental',
                      'kuzhandhai': 'pediatrics', 'pillaigal': 'pediatrics', 'child': 'pediatrics',
                      'thool': 'dermatology', 'thol': 'dermatology', 'skin': 'dermatology',
                      'kann': 'ophthalmology', 'kan': 'ophthalmology', 'eye': 'ophthalmology',
                      'elumbu': 'orthopedics', 'bone': 'orthopedics', 'elambiyan': 'orthopedics', 'elumbiyal': 'orthopedics',
                      'pengal': 'gynecology', 'ladies': 'gynecology',
                      'narambu': 'neurology', 'brain': 'neurology',
                      'pothu': 'general',
                      'mooku': 'ent', 'mookku': 'ent', 'thondai': 'ent', 'dondai': 'ent', 'movie dondai': 'ent', 'kaandhu': 'ent', 'ent': 'ent',
                      'kathir': 'radiology', 'xray': 'radiology', 'scan': 'radiology', 'radiology': 'radiology'
                    };
                    for (let k in translationMap) {
                       if (translatedText.includes(k)) translatedText += " " + translationMap[k];
                    }
                }
                
                // Time slot matching logic
                if (step === 'time') {
                    let textToMatch = translatedText;
                    
                    const timeWordsMap = {
                       'onnara': '1 30', 'rendara': '2 30', 'moonara': '3 30', 'nalara': '4 30', 'anjara': '5 30',
                       'arara': '6 30', 'ezhara': '7 30', 'elara': '7 30', 'ettara': '8 30', 'onbathara': '9 30', 'pathara': '10 30', 'paththara': '10 30',
                       'pathinonnara': '11 30', 'pannandara': '12 30',
                       'ara': '30', 'kaal': '15', 'mukaal': '45', 'mukal': '45', 'mani': ''
                    };
                    for(let w in timeWordsMap) textToMatch = textToMatch.replace(new RegExp(`\\b${w}\\b`, 'g'), timeWordsMap[w]);
                    
                    const numMap = {
                      'one':'1', 'onnu':'1', 'on':'1', 'won':'1',
                      'two':'2', 'rendu':'2', 'twoo':'2', 'too':'2',
                      'three':'3', 'moonu':'3', 'muna':'3', 'tree':'3', 'thri':'3',
                      'four':'4', 'naalu':'4', 'nal':'4', 'for':'4',
                      'five':'5', 'anju':'5', 'aaenge':'5', 'ange':'5', 'and':'5', 'anji':'5', 'fiv':'5',
                      'six':'6', 'aaru':'6', 'aru':'6',
                      'seven':'7', 'ezhu':'7', 'ealu':'7', 'elu':'7', 'yelu':'7',
                      'eight':'8', 'ettu':'8', 'etu':'8', 'ate':'8',
                      'nine':'9', 'ombathu':'9', 'ombadu':'9', 'onbathu':'9',
                      'ten':'10', 'pathu':'10', 'patu':'10',
                      'eleven':'11', 'pathinonnu':'11',
                      'twelve':'12', 'pannandu':'12', 'panandu':'12'
                    };
                    for(let w in numMap) textToMatch = textToMatch.replace(new RegExp(`\\b${w}\\b`, 'g'), numMap[w]);
                    
                    if (indexMatch && new RegExp(`\\b${indexMatch[1]}\\b`).test(textToMatch)) {
                        return true;
                    }
                    
                    // Fallback to checking the time itself
                    const timeStr = lbl.replace(/^\d+\.\s*/, '');
                    const startMatch = timeStr.match(/^(\d+)(?:\.(\d+)|:(\d+))?\s*(am|pm)?/i);
                    if (startMatch) {
                        const h = startMatch[1];
                        const m = startMatch[2] || startMatch[3] || '00';
                        const hasHour = new RegExp(`\\b${h}\\b`).test(textToMatch);
                        if (hasHour) {
                            if (m !== '00') {
                                if (new RegExp(`\\b${m}\\b`).test(textToMatch)) return true;
                            } else {
                                if (!/(30|15|45)/.test(textToMatch)) return true;
                            }
                        }
                    }
                }
                
                return lbl.includes(lowerText) || 
                       lowerText.includes(primaryWord) || 
                       (cleanPrimary && translatedText.includes(cleanPrimary.toLowerCase())) ||
                       (secondaryWord && translatedText.includes(secondaryWord));
            });
          }
          if (matchedOption) {
              matchedMsgId = lastBotMsgWithOptions.id;
          }
      }

      if (matchedOption) {
        if (matchedOption.disabled) {
          setTimeout(() => {
            addUserMessage(text);
            addBotMessage("Sorry, this timing is already booked. Please choose another available timing.\n\nமன்னிக்கவும், இந்த நேரம் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது. வேறு நேரத்தை தேர்ந்தெடுக்கவும்.");
          }, 100);
          return prev;
        }

        // Delay slightly to escape setMessages context before calling handleOptionSelect
        setTimeout(() => {
          handleOptionSelect(matchedOption, matchedMsgId, text); 
        }, 100);
        return prev; 
      }

      // Normal text progression
      let processedText = text;
      const currentStepVal = currentStepRef.current;
      if (currentStepVal === 'age') {
          processedText = extractAgeText(text);
      } else if (currentStepVal === 'whatsapp') {
          const waMatch = extractPhoneNumberText(text);
          const digitOnly = waMatch.replace(/\D/g, '');
          if (digitOnly.length > 0) processedText = digitOnly;
      }

      const newMessages = [...prev, { id: (Date.now() + Math.random()).toString(), text: processedText, isBot: false }];
      
      setTimeout(() => {
        const step = currentStepRef.current;
        if (step === 'name') {
          setFormData(f => ({ ...f, patientName: processedText }));
          setCurrentStep('age');
          addBotMessage("How old are you?\n\nஉங்கள் வயதை உள்ளிடவும்.");
          setInputMode('text');
        } else if (step === 'age') {
          setFormData(f => ({ ...f, age: processedText }));
          setCurrentStep('gender');
          addBotMessage("Please Select your gender.\n\nபாலினத்தை தேர்வு செய்யவும்.", [
            { label: '1. Male / ஆண்', value: 'Male' },
            { label: '2. Female / பெண்', value: 'Female' },
            { label: '3. Others / மற்றவை', value: 'Others' }
          ], 'options');
        } else if (step === 'whatsapp') {
          setFormData(f => ({ ...f, whatsapp: processedText }));
          setCurrentStep('date');
          
          const msgId = (Date.now() + Math.random()).toString();
          setMessages(prev => [...prev, {
            id: msgId,
            text: "Please Select a Date\n\nதேதியை தேர்வு செய்யவும்.",
            isBot: true,
            isCalendar: true
          }]);
          
          setInputMode('date');
          
          const parts = "Please Select a Date".split('\n\n');
          const textToSpeak = parts.length > 1 ? parts[1] : parts[0];
          Tts.stop();
          Tts.speak(textToSpeak.replace(/\n/g, ' '));
        } else if (step === 'date') {
            let parsedDate = null;
            const cleanText = text.toLowerCase().replace(/[^a-z0-9\s\u0B80-\u0BFF]/g, '').trim();
            const today = new Date();
            
            const wordToNum = { 
              'first':'1', 'second':'2', 'third':'3', 'fourth':'4', 'fifth':'5', 'sixth':'6', 'seventh':'7', 'eighth':'8', 'ninth':'9', 'tenth':'10', 'eleventh':'11', 'twelfth':'12',
              'one':'1', 'onnu':'1', 'onnam':'1', 'on':'1', 'ஒன்று':'1', 'ஒன்னு':'1', 'முதல்':'1', 'ஒன்றாம்':'1', 'ஒன்னாம்':'1',
              'two':'2', 'rendu':'2', 'rendam':'2', 'இரண்டு':'2', 'ரெண்டு':'2', 'இரண்டாம்':'2', 'ரெண்டாம்':'2',
              'three':'3', 'moonu':'3', 'moonam':'3', 'மூன்று':'3', 'மூணு':'3', 'மூன்றாம்':'3', 'மூணாம்':'3',
              'four':'4', 'naalu':'4', 'naalam':'4', 'நான்கு':'4', 'நாலு':'4', 'நான்காம்':'4', 'நாலாம்':'4',
              'five':'5', 'anju':'5', 'anjam':'5', 'ஐந்து':'5', 'அஞ்சு':'5', 'ஐந்தாம்':'5', 'அஞ்சாம்':'5',
              'six':'6', 'aaru':'6', 'aaram':'6', 'ஆறு':'6', 'ஆறாம்':'6',
              'seven':'7', 'ezhu':'7', 'ezham':'7', 'ஏழு':'7', 'ஏழாம்':'7',
              'eight':'8', 'ettu':'8', 'ettam':'8', 'எட்டு':'8', 'எட்டாம்':'8',
              'nine':'9', 'ombathu':'9', 'ombatham':'9', 'ஒன்பது':'9', 'ஒன்பதாம்':'9',
              'ten':'10', 'pathu':'10', 'patham':'10', 'பத்து':'10', 'பத்தாம்':'10',
              'eleven':'11', 'pathinonnu':'11', 'pathinonnam':'11', 'பதினொன்று':'11', 'பதினொன்னு':'11', 'பதினொன்றாம்':'11',
              'twelve':'12', 'pannandu':'12', 'pannandam':'12', 'பன்னிரண்டு':'12', 'பன்னிரண்டாம்':'12', 'பன்னிரெண்டு':'12',
              'thirteen':'13', 'pathimoonu':'13', 'pathimoonam':'13', 'பதின்மூன்று':'13', 'பதின்மூணு':'13', 'பதின்மூன்றாம்':'13',
              'fourteen':'14', 'pathinaalu':'14', 'pathinaalam':'14', 'பதினான்கு':'14', 'பதினாலு':'14', 'பதினான்காம்':'14', 'pathinalu':'14', 'patinalu':'14', 'patina':'14', 'pathinal':'14',
              'fifteen':'15', 'pathinanju':'15', 'pathinanjam':'15', 'பதினைந்து':'15', 'பதினஞ்சு':'15', 'பதினைந்தாம்':'15', 'pathinange':'15',
              'sixteen':'16', 'pathinaaru':'16', 'pathinaaram':'16', 'பதினாறு':'16', 'பதினாறாம்':'16', 'pathinar':'16', 'patina re':'16', 'patinar':'16',
              'seventeen':'17', 'pathinealu':'17', 'pathinezham':'17', 'பதினேழு':'17', 'பதினேழாம்':'17',
              'eighteen':'18', 'pathinettu':'18', 'pathinettam':'18', 'பதினெட்டு':'18', 'பதினெட்டாம்':'18',
              'nineteen':'19', 'pathombathu':'19', 'pathombatham':'19', 'பத்தொன்பது':'19', 'பத்தொன்பதாம்':'19',
              'twenty':'20', 'iruvathu':'20', 'irubathu':'20', 'iruvatham':'20', 'இருபது':'20', 'இருபதாம்':'20',
              'twentyone':'21', 'iruvathi onnu':'21', 'இருபத்தி ஒன்று':'21', 'இருபத்தி ஒன்னு':'21',
              'twentytwo':'22', 'iruvathi rendu':'22', 'இருபத்தி இரண்டு':'22', 'இருபத்தி ரெண்டு':'22',
              'twentythree':'23', 'iruvathi moonu':'23', 'இருபத்தி மூன்று':'23', 'இருபத்தி மூணு':'23',
              'twentyfour':'24', 'iruvathi naalu':'24', 'இருபத்தி நான்கு':'24', 'இருபத்தி நாலு':'24',
              'twentyfive':'25', 'iruvathi anju':'25', 'இருபத்தி ஐந்து':'25', 'இருபத்தி அஞ்சு':'25',
              'twentysix':'26', 'iruvathi aaru':'26', 'இருபத்தி ஆறு':'26',
              'twentyseven':'27', 'iruvathi ezhu':'27', 'இருபத்தி ஏழு':'27',
              'twentyeight':'28', 'iruvathi ettu':'28', 'இருபத்தி எட்டு':'28',
              'twentynine':'29', 'iruvathi ombathu':'29', 'இருபத்தி ஒன்பது':'29',
              'thirty':'30', 'muppathu':'30', 'முப்பது':'30', 'முப்பதாம்':'30',
              'thirtyone':'31', 'muppathi onnu':'31', 'முப்பத்தி ஒன்று':'31', 'முப்பத்தி ஒன்னு':'31'
            };
            const monthMap = { 
              'january':0, 'jan':0, 'janavary':0, 'ஜனவரி':0,
              'february':1, 'feb':1, 'pibravary':1, 'பிப்ரவரி':1,
              'march':2, 'mar':2, 'maarch':2, 'மார்ச்':2,
              'april':3, 'apr':3, 'eapral':3, 'aeppral':3, 'ஏப்ரல்':3,
              'may':4, 'me':4, 'மே':4,
              'june':5, 'jun':5, 'joon':5, 'ஜூன்':5,
              'july':6, 'jul':6, 'joolai':6, 'ஜூலை':6, 'jewellery':6, 'jully':6,
              'august':7, 'aug':7, 'aagastu':7, 'ஆகஸ்ட்':7,
              'september':8, 'sep':8, 'septambar':8, 'செப்டம்பர்':8,
              'october':9, 'oct':9, 'aktobar':9, 'அக்டோபர்':9,
              'november':10, 'nov':10, 'navambar':10, 'நவம்பர்':10,
              'december':11, 'dec':11, 'disambar':11, 'டிசம்பர்':11
            };

            if (cleanText.includes('tomorrow') || cleanText.includes('naalaiki') || cleanText.includes('naalai') || cleanText.includes('நாளை')) {
              parsedDate = new Date();
              parsedDate.setDate(today.getDate() + 1);
            } else if (cleanText.includes('today') || cleanText.includes('innaiki') || cleanText.includes('indru') || cleanText.includes('இன்று') || cleanText.includes('இன்னைக்கு')) {
              parsedDate = new Date();
            } else if (cleanText.includes('day after') || cleanText.includes('naalanadhu') || cleanText.includes('நாளான்னக்கி') || cleanText.includes('நாளை மறுநாள்') || cleanText.includes('நாளான்னைக்கு')) {
              parsedDate = new Date();
              parsedDate.setDate(today.getDate() + 2);
            } else {
              const sortedMonths = Object.keys(monthMap).sort((a, b) => b.length - a.length);
              let monthStr = sortedMonths.find(m => cleanText.includes(m));
              if (monthStr) {
                const month = monthMap[monthStr];
                const dayMatch = cleanText.match(/\b(\d{1,2})\b/);
                let day = dayMatch ? parseInt(dayMatch[1], 10) : null;
                
                if (!day) {
                  const sortedWords = Object.keys(wordToNum).sort((a, b) => b.length - a.length);
                  const wordMatch = sortedWords.find(w => cleanText.includes(w));
                  if (wordMatch) day = parseInt(wordToNum[wordMatch], 10);
                }
                
                if (day && day >= 1 && day <= 31) {
                  let year = today.getFullYear();
                  const yearMatch = cleanText.match(/\b(202\d)\b/);
                  if (yearMatch) {
                    year = parseInt(yearMatch[1], 10);
                  }
                  
                  parsedDate = new Date(year, month, day);
                  
                  if (!yearMatch && parsedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                    parsedDate.setFullYear(year + 1);
                  }
                }
              }
            }

            if (parsedDate) {
              handleDateConfirm(parsedDate, true);
            } else {
              const msgId = (Date.now() + Math.random()).toString();
              setMessages(prev => [...prev, {
                id: msgId,
                text: "Sorry, I didn't catch the date. Please try saying 'Tomorrow' or pick a date below.\n\nமன்னிக்கவும், தேதி எனக்குப் புரியவில்லை. 'நாளைக்கு' என்று சொல்லவும் அல்லது கீழே உள்ள காலண்டரில் தேர்ந்தெடுக்கவும்.",
                isBot: true,
                isCalendar: true
              }]);
              setInputMode('date');
            }
        } else {
          addBotMessage("Sorry, I didn't understand. Please select from the options or try again.\n\nமன்னிக்கவும், எனக்கு புரியவில்லை. விருப்பங்களில் ஒன்றை தேர்ந்தெடுக்கவும்.");
          if (step === 'name' || step === 'age' || step === 'whatsapp') {
            setInputMode('text');
          } else if (step === 'date') {
            setInputMode('date');
          } else {
            setInputMode('none');
          }
        }
      }, 500);

      return newMessages;
    });
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    processUserInput(text);
  };

  const handleOptionSelect = (option, msgId, customUserText = null) => {
    // Hide options from the message that was just interacted with
    if (msgId) {
      setMessages(prev => prev.map(msg => msg.id === msgId ? { ...msg, options: [] } : msg));
    }
    
    // Always show the bilingual label in the chat bubble (e.g., "Male / ஆண்")
    const formattedLabel = option.label.replace(/\n/g, ' / ');
    
    addUserMessage(formattedLabel);
    setInputMode('none');

    setTimeout(() => {
      const step = currentStepRef.current;
      
      if (option.value === 'book_appointment') {
        setCurrentStep('name');
        addBotMessage("Sure! Let's get started.\nWhat is your full name?\n\nசரி, ஆரம்பிக்கலாம். உங்கள் முழு பெயர் என்ன?");
        setInputMode('text');
      } else if (step === 'gender') {
        setFormData(prev => ({ ...prev, gender: option.value }));
        setCurrentStep('whatsapp');
        addBotMessage("Great! Now, please share your whatsapp number.\n\nஅற்புதம்! இப்போது உங்கள் WhatsApp எண்ணை பகிரவும்.");
        setInputMode('text');
      } else if (step === 'category') {
        const docsForCategory = availableDoctorsForDate.filter(doc => {
          if (!doc.department) return option.originalName === 'Others';
          const depts = doc.department.split(',').map(cat => cat.trim());
          return depts.includes(option.fullDepartment);
        });
        const formattedDoctors = docsForCategory.map((doc, index) => ({
           _id: doc._id || doc.id,
           label: `${index + 1}. ` + doc.doctorName + " / " + (doc.experience ? doc.experience + " Yrs" : ""),
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
      } else if (step === 'doctor') {
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
          const timingOptions = timings.map((t, index) => ({ 
            label: `${index + 1}. ${t}`, 
            value: t,
            disabled: booked.includes(t)
          }));
          addBotMessage("Now select an available time.\n\nநேரத்தை தேர்வு செய்யவும்.", timingOptions, 'options');
        } else {
          addBotMessage("Sorry, no slots are available for this doctor.\n\nமன்னிக்கவும், இந்த மருத்துவருக்கு நேரம் இல்லை.", [{label: 'Select another doctor', value: 'reselect_doctor'}], 'options');
          setCurrentStep('category'); 
        }
      } else if (step === 'time') {
        setFormData(prev => ({ ...prev, time: option.value }));
        setCurrentStep('confirm');
        addBotMessage("Your details have been collected. Confirm Booking?\n\nஉங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன. முன்பதிவை உறுதி செய்யவா?", [
          { label: '1. Confirm Booking / உறுதி செய்', value: 'confirm' },
          { label: '2. Cancel / ரத்து செய்', value: 'cancel' }
        ], 'options');
      } else if (step === 'confirm') {
        if (option.value === 'confirm') {
          submitBooking();
        } else {
          const mobile = user?.contactNumber || user?.mobile || "N/A";
          AsyncStorage.removeItem(`chatState_${mobile}`);
          AsyncStorage.removeItem(`chatHistory_${mobile}`);

          setMessages([{
            id: (Date.now() + Math.random()).toString(),
            text: "Booking Cancelled. Click the retry button to start again.\n\nமுன்பதிவு ரத்து செய்யப்பட்டது. மீண்டும் தொடங்க ரீட்ரை பட்டனை அழுத்தவும்.",
            isBot: true,
            options: [],
            type: 'text',
            customData: { type: 'retry' }
          }]);
          
          Tts.stop();
          Tts.speak("Booking Cancelled. Click the retry button to start again.");

          setCurrentStep('start');
          setInputMode('none');
        }
      }
    }, 500);
  };

  const handleDateConfirm = (selectedDate, skipMessage = false) => {
    
    if (selectedDate) {
      if (!skipMessage) {
          addUserMessage(formatDate(selectedDate));
      }
      setFormData(prev => ({ ...prev, date: selectedDate }));
      setInputMode('none');
      setCurrentStep('category');
      
      // Hide the inline calendar from the messages list
      setMessages(prev => prev.map(msg => msg.isCalendar ? { ...msg, isCalendar: false } : msg));

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
        const mobile = user?.contactNumber || user?.mobile || "N/A";
        await AsyncStorage.removeItem(`chatState_${mobile}`);
        await AsyncStorage.removeItem(`chatHistory_${mobile}`);
        
        setCurrentStep('start');
        
        setMessages([{
          id: (Date.now() + Math.random()).toString(),
          text: "✅ Appointment Request Sent Successfully!\nஉங்கள் முன்பதிவு கோரிக்கை அனுப்பப்பட்டது.",
          isBot: true,
          options: [],
          type: 'text'
        }]);
        
        Tts.stop();
        Tts.speak("Appointment Request Sent Successfully!");

        setTimeout(() => {
          navigation.navigate('Dashboard');

          // Reset the screen so it's fresh if they come back
          setTimeout(() => {
            setMessages([{
              id: (Date.now() + Math.random()).toString(),
              text: 'Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?',
              isBot: true,
              options: [{ label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்', value: 'book_appointment' }],
            }]);
            setFormData({
              patientName: '', age: '', gender: '', whatsapp: '',
              category: null, doctor: null, date: new Date(), time: ''
            });
            setCurrentStep('start');
          }, 500);

        }, 2000);
      }
    } catch (error) {
      addBotMessage("❌ Booking failed. Please try again later.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEditMessage = (item) => {
    const msgIndex = messages.findIndex(m => m.id === item.id);
    if (msgIndex > 0) {
      const prevBotMsg = messages[msgIndex - 1];
      if (prevBotMsg && prevBotMsg.isBot) {
        const botText = prevBotMsg.text.toLowerCase();
        
        let stepToReset = null;
        if (botText.includes('full name') || botText.includes('பெயர்')) stepToReset = 'name';
        else if (botText.includes('how old') || botText.includes('வயதை')) stepToReset = 'age';
        else if (botText.includes('whatsapp') || botText.includes('whatsapp எண்')) stepToReset = 'whatsapp';
        
        // Dependent fields (Options/Calendar based)
        else if (botText.includes('gender') || botText.includes('பாலினத்தை')) stepToReset = 'gender';
        else if (botText.includes('date') || botText.includes('தேதியை')) stepToReset = 'date';
        else if (botText.includes('category') || botText.includes('சிகிச்சையை')) stepToReset = 'category';
        else if (botText.includes('select a doctor') || botText.includes('மருத்துவரை')) stepToReset = 'doctor';
        
        if (stepToReset) {
           if (['name', 'age', 'whatsapp'].includes(stepToReset)) {
               // IN-PLACE EDIT: Don't slice messages!
               setEditingState({ msgId: item.id, step: stepToReset });
               setInputMode('text');
               setInputText(item.text); // Put old text in input box
           } else {
               // ROLLBACK EDIT: Erase subsequent messages because choices depend on this!
               setMessages(prev => prev.slice(0, msgIndex));
               setCurrentStep(stepToReset);
               
               if (stepToReset === 'date') {
                  setInputMode('date');
                  // Re-add the bot message to trigger calendar correctly
                  addBotMessage("Please Select a Date\n\nதேதியை தேர்வு செய்யவும்.");
                  setMessages(prev => {
                     const updated = [...prev];
                     updated[updated.length - 1].isCalendar = true;
                     return updated;
                  });
               } else if (stepToReset === 'gender') {
                  setInputMode('none');
                  addBotMessage("Please Select your gender.\n\nபாலினத்தை தேர்வு செய்யவும்.", [
                    { label: '1. Male / ஆண்', value: 'Male' },
                    { label: '2. Female / பெண்', value: 'Female' },
                    { label: '3. Others / மற்றவை', value: 'Others' }
                  ], 'options');
               } else if (stepToReset === 'category') {
                  setInputMode('none');
                  addBotMessage("Now, Select your treatment category you need.\n\nதேவையான சிகிச்சையை தேர்வு செய்யவும்.", doctorCategories, 'options');
               } else if (stepToReset === 'doctor') {
                  setInputMode('none');
                  // Just reset back to category to be safe
                  setCurrentStep('category');
                  addBotMessage("Please re-select your treatment category to fetch available doctors.\n\nதேவையான சிகிச்சையை மீண்டும் தேர்வு செய்யவும்.", doctorCategories, 'options');
               } else {
                  setInputMode('none');
               }
           }
        }
      }
    }
  };

  const renderMessage = ({ item }) => {
    return (
      <View style={{ marginBottom: 10 }}>
        <View style={[styles.messageWrapper, item.isBot ? styles.messageWrapperBot : styles.messageWrapperUser, { marginBottom: 0 }]}>
        {item.isBot && (
          <View style={styles.botIconContainer}>
            <Image source={require('../assets/Group 1707481560.png')} style={{ width: 32, height: 32, resizeMode: 'contain' }} />
          </View>
        )}
        <View style={item.isBot ? styles.messageBubbleBot : styles.messageBubbleUser}>
          {item.isBot ? (
            <Text style={styles.messageTextBot}>{item.text}</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.messageTextUser}>{item.text}</Text>
              <TouchableOpacity onPress={() => handleEditMessage(item)} style={{ marginLeft: 10, padding: 4 }}>
                <Icon name="pencil-outline" size={16} color="#1C3E55" />
              </TouchableOpacity>
            </View>
          )}
          
          {item.isCalendar && (
            <View style={{ marginTop: 15, borderRadius: 10, overflow: 'hidden', width: '100%', alignSelf: 'center', backgroundColor: '#fff' }}>
               <Calendar 
                 minDate={new Date().toISOString().split('T')[0]}
                 onDayPress={(day) => {
                    const selectedDate = new Date(day.timestamp);
                    handleDateConfirm(selectedDate);
                 }}
                 theme={{
                   todayTextColor: '#E74C3C',
                   selectedDayBackgroundColor: '#1C3E55',
                   arrowColor: '#1C3E55',
                   textDayFontWeight: '500',
                   textMonthFontWeight: 'bold',
                   textDayHeaderFontWeight: '500'
                 }}
                 style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 10,
                 }}
               />
            </View>
          )}

          {item.options && item.options.length > 0 && (
            <View style={styles.optionsContainer}>
              {item.options.map((opt, idx) => {
                const match = opt.label.match(/^(\d+)\.\s*(.*)/);
                const isNumbered = !!match;
                const numberStr = isNumbered ? match[1] : null;
                const labelText = isNumbered ? match[2] : opt.label;
                
                return (
                <TouchableOpacity 
                  key={idx} 
                  style={[
                    styles.optionButton, 
                    opt.disabled && styles.optionButtonDisabled,
                    isNumbered && { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 15 }
                  ]} 
                  onPress={() => handleOptionSelect(opt, item.id)}
                  disabled={opt.disabled}
                >
                  {isNumbered && (
                     <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#28A745', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                        <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>{numberStr}</Text>
                     </View>
                  )}
                  <Text style={[
                    styles.optionText, 
                    opt.disabled && styles.optionTextDisabled,
                    isNumbered && { flex: 1, textAlign: 'left' }
                  ]}>{labelText}</Text>
                </TouchableOpacity>
              )})}
            </View>
          )}

          {item.customData && item.customData.type === 'retry' && (
            <TouchableOpacity 
               style={{ alignSelf: 'flex-start', marginTop: 15, paddingVertical: 8, paddingHorizontal: 15, backgroundColor: '#E0E0E0', borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
               onPress={() => {
                   const mobile = user?.contactNumber || user?.mobile || "N/A";
                   AsyncStorage.removeItem(`chatState_${mobile}`);
                   AsyncStorage.removeItem(`chatHistory_${mobile}`);

                   setFormData({
                     patientName: '', age: '', gender: '', whatsapp: '',
                     category: null, doctor: null, date: new Date(), time: ''
                   });
                   setCurrentStep('start');
                   
                   setMessages([
                     {
                       id: (Date.now() + Math.random()).toString(),
                       text: 'Hi,\nI am Your DrZ AI Assistant\nHow Can I Help You Today?\n\nவணக்கம்\nநான் உங்கள் DrZ AI உதவியாளர்.\nஉங்களுக்கு எப்படி உதவலாம்?',
                       isBot: true,
                     }
                   ]);

                   setTimeout(() => {
                      handleOptionSelect({ value: 'book_appointment', label: 'Book an appointment\nசந்திப்பை முன்பதிவு செய்யவும்' }, item.id);
                   }, 100);
               }}>
               <Icon name="refresh" size={20} color="#1C3E55" style={{ marginRight: 5 }} />
               <Text style={{ color: '#1C3E55', fontWeight: 'bold' }}>Retry / மீண்டும் தொடங்கு</Text>
            </TouchableOpacity>
          )}
        </View>
        {!item.isBot && (
          <View style={styles.userIconContainer}>
            <Icon name="account-outline" size={20} color="#999" />
          </View>
        )}
        </View>
        
        {item.isBot && item.options && item.options.some(opt => opt.label.match(/^(\d+)\.\s*/)) && (
           <Text style={{ fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 4, marginLeft: 45 }}>
              💡 You can also say the numbers to select / எண்களையும் சொல்லி தேர்ந்தெடுக்கலாம்.
           </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={[styles.userInfo, { backgroundColor: '#F0F0F0', padding: 5, paddingRight: 15, borderRadius: 25 }]}>
          <Image source={require('../assets/logo.png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#FFF' }} resizeMode="contain" />
          <View style={styles.textContainer}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111' }}>Welcome To DrZ</Text>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 0 }]} onPress={() => navigation.navigate('NotificationPatient')}>
            <Icon name="bell-outline" size={24} color="#6276F5" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 0, marginLeft: 5 }]} onPress={() => { /* Logout logic can be added here */ }}>
            <Icon name="logout" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="arrow-left" size={24} color="#333" />
          <Text style={styles.headerTitle}>AI Assistance / AI உதவியாளர்</Text>
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


        <View style={styles.inputContainer}>
          <TouchableOpacity 
            onPress={isListening ? stopListening : startListening} 
            style={[styles.micButton, isListening && styles.micButtonActive, { marginLeft: 0, marginRight: 10 }]}>
            <Icon name="microphone" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder={inputMode === 'date' ? "Type or say a date..." : "Type a message..."}
            placeholderTextColor="#000"
            value={inputText}
            onChangeText={setInputText}
            keyboardType={currentStep === 'age' || currentStep === 'whatsapp' ? 'numeric' : 'default'}
          />
          <TouchableOpacity onPress={handleSendText} style={styles.sendButton}>
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: '#fff'
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { justifyContent: 'center' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { backgroundColor: '#F0F0F0', padding: 8, borderRadius: 22.5, elevation: 0 },
  header: {
    padding: 15,
    paddingTop: 5,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 10 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-start' },
  messageWrapperBot: { justifyContent: 'flex-start' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  botIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
    backgroundColor: 'transparent'
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
  smallCalendarBtn: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  }
});

export default ChatBotBookingScreen;
