import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, PermissionsAndroid, NativeModules, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const isTtsAvailable = !!NativeModules.TextToSpeech;
const isVoiceAvailable = !!NativeModules.Voice || !!NativeModules.RCTVoice;

const parseTimeStringToMinutes = (timeStr) => {
  try {
    let clean = timeStr.toLowerCase().replace(/\s+/g, ' ').trim(); // keep single space between numbers
    let isPM = clean.includes('pm');
    let isAM = clean.includes('am');
    clean = clean.replace('am', '').replace('pm', '').trim();

    let hours = -1;
    let minutes = 0;

    // Check if there is a separator like : or .
    if (clean.includes(':') || clean.includes('.')) {
      let parts = clean.split(/[:.]/);
      hours = parseInt(parts[0], 10);
      minutes = parts[1] ? parseInt(parts[1], 10) : 0;
    } else {
      // No separator. E.g. "7 23" or "723" or "0723" or "7"
      // If there is a space separating two numbers, e.g. "7 23"
      const spaceParts = clean.split(/\s+/);
      if (spaceParts.length >= 2) {
        hours = parseInt(spaceParts[0], 10);
        minutes = parseInt(spaceParts[1], 10);
      } else {
        // Pure digits sequence or a single digit
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
    console.log("Error parsing time string:", timeStr, err);
    return -1;
  }
};

const convertSpokenNumber = (text) => {
  const clean = text.toLowerCase().trim();
  const numberWords = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90
  };

  if (/^\d+$/.test(clean)) {
    return clean;
  }

  const parts = clean.split(/[\s\-]+/);
  let total = 0;
  let hasWord = false;
  for (const part of parts) {
    if (numberWords[part] !== undefined) {
      total += numberWords[part];
      hasWord = true;
    } else if (/^\d+$/.test(part)) {
      total += parseInt(part, 10);
      hasWord = true;
    }
  }
  return hasWord ? total.toString() : text;
};

const matchNumberFromSpokenText = (spokenText) => {
  if (!spokenText) return -1;
  const clean = spokenText.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF\s]/g, '').trim();

  const directDigit = clean.replace(/\D/g, '');
  if (directDigit) {
    const num = parseInt(directDigit, 10);
    if (num >= 1 && num <= 100) return num;
  }

  const englishWords = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
  };

  const tamilWords = {
    'ஒன்று': 1, 'ஒன்னு': 1, 'ஒன்னாவது': 1, 'ஒன்': 1, 'முதல்': 1, 'முதலாம்': 1,
    'இரண்டு': 2, 'ரெண்டு': 2, 'ரெண்டாவது': 2, 'டூ': 2, 'இரண்டாம்': 2,
    'மூன்று': 3, 'மூணு': 3, 'மூணாவது': 3, 'த்ரீ': 3, 'மூன்றாம்': 3,
    'நான்கு': 4, 'நாலு': 4, 'நாலாவது': 4, 'போர்': 4, 'நான்காம்': 4,
    'ஐந்து': 5, 'அஞ்சு': 5, 'அஞ்சாவது': 5, 'பைவ்': 5, 'ஐந்தாம்': 5,
    'ஆறு': 6, 'ஆறாவது': 6, 'சிக்ஸ்': 6, 'ஆறாம்': 6,
    'ஏழு': 7, 'ஏழாவது': 7, 'செவன்': 7, 'ஏழாம்': 7,
    'எட்டு': 8, 'எட்டாவது': 8, 'எய்ட்': 8, 'எட்டாம்': 8,
    'ஒன்பது': 9, 'ஒன்பதாவது': 9, 'நைன்': 9, 'ஒன்பதாம்': 9,
    'பத்து': 10, 'பத்தாவது': 10, 'டென்': 10, 'பத்தாம்': 10
  };

  const words = clean.split(/\s+/);
  for (const word of words) {
    if (englishWords[word]) return englishWords[word];
    if (tamilWords[word]) return tamilWords[word];
  }

  for (const [key, val] of Object.entries(tamilWords)) {
    if (clean.includes(key)) return val;
  }
  for (const [key, val] of Object.entries(englishWords)) {
    if (clean.includes(key)) return val;
  }

  return -1;
};

let messageCounter = 0;
const getUniqueId = () => {
  messageCounter += 1;
  return `${Date.now()}_${messageCounter}_${Math.random().toString(36).substring(2, 9)}`;
};

const parseSpokenDate = (spokenText) => {
  if (!spokenText) return null;
  // Replace ordinal suffixes and normalize spacing/casing
  let clean = spokenText.toLowerCase()
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/[^a-z0-9/\-\s\u0B80-\u0BFF]/g, '')
    .trim();

  // Handle case with no separators, e.g. "03072026" or "3072026"
  const digitsOnly = clean.replace(/\s+/g, '');
  const noSeparatorMatch = digitsOnly.match(/^(\d{1,2})(\d{2})(\d{4})$/);
  if (noSeparatorMatch) {
    const day = parseInt(noSeparatorMatch[1], 10);
    const month = parseInt(noSeparatorMatch[2], 10);
    const year = parseInt(noSeparatorMatch[3], 10);
    return { day, month, year };
  }

  // Try parsing direct format: DD/MM/YYYY or DD-MM-YYYY
  const directMatch = clean.match(/(\d{1,2})[\/\-\s]+(\d{1,2})[\/\-\s]+(\d{4})/);
  if (directMatch) {
    const day = parseInt(directMatch[1], 10);
    const month = parseInt(directMatch[2], 10);
    const year = parseInt(directMatch[3], 10);
    return { day, month, year };
  }

  // Check for month names
  const months = [
    { names: ['january', 'jan', 'jan.', 'ஜனவரி'], value: 1 },
    { names: ['february', 'feb', 'feb.', 'பிப்ரவரி'], value: 2 },
    { names: ['march', 'mar', 'mar.', 'மார்ச்'], value: 3 },
    { names: ['april', 'apr', 'apr.', 'ஏப்ரல்'], value: 4 },
    { names: ['may', 'மே'], value: 5 },
    { names: ['june', 'jun', 'jun.', 'ஜூன்'], value: 6 },
    { names: ['july', 'jul', 'jul.', 'ஜூலை'], value: 7 },
    { names: ['august', 'aug', 'aug.', 'ஆகஸ்ட்'], value: 8 },
    { names: ['september', 'sept', 'sep', 'sep.', 'செப்டம்பர்'], value: 9 },
    { names: ['october', 'oct', 'oct.', 'அக்டோபர்'], value: 10 },
    { names: ['november', 'nov', 'nov.', 'நவம்பர்'], value: 11 },
    { names: ['december', 'dec', 'dec.', 'டிசம்பர்'], value: 12 }
  ];

  let detectedMonth = null;
  for (const m of months) {
    for (const name of m.names) {
      if (clean.includes(name)) {
        detectedMonth = m.value;
        break;
      }
    }
    if (detectedMonth) break;
  }

  // Extract year (4 digits)
  const yearMatch = clean.match(/\b(20\d{2})\b/);
  const detectedYear = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

  // Extract day (1 or 2 digits)
  let textWithoutYear = clean;
  if (yearMatch) {
    textWithoutYear = clean.replace(yearMatch[0], '');
  }

  if (detectedMonth) {
    const monthObj = months.find(m => m.value === detectedMonth);
    monthObj.names.forEach(name => {
      textWithoutYear = textWithoutYear.replace(name, '');
    });
  }

  const dayMatches = textWithoutYear.match(/\b([123]?\d)\b/g);
  let detectedDay = null;
  if (dayMatches) {
    for (const dm of dayMatches) {
      const dVal = parseInt(dm, 10);
      if (dVal >= 1 && dVal <= 31) {
        detectedDay = dVal;
        break;
      }
    }
  }

  if (detectedDay !== null && detectedMonth !== null) {
    return { day: detectedDay, month: detectedMonth, year: detectedYear };
  }

  return null;
};

const matchDateOption = (spokenText, options) => {
  const parsed = parseSpokenDate(spokenText);
  if (!parsed || !options || !Array.isArray(options)) return null;

  return options.find(opt => {
    if (!opt.formatted) return false;
    const [optD, optM, optY] = opt.formatted.split('/').map(Number);
    return optD === parsed.day && optM === parsed.month && optY === parsed.year;
  });
};

const matchTimeOption = (spokenText, options) => {
  if (!spokenText || !options || !Array.isArray(options)) return null;
  const normalizedSpoken = spokenText.toLowerCase().replace(/\s+/g, '');

  if (!/\d/.test(normalizedSpoken)) return null;

  // 1. Direct or substring match
  let matched = options.find(opt => {
    const normalizedOpt = opt.id.toLowerCase().replace(/\s+/g, '');
    return normalizedOpt.includes(normalizedSpoken) || normalizedSpoken.includes(normalizedOpt);
  });
  if (matched) return matched;

  // 2. Start time minutes match
  const spokenStartPart = spokenText.split(/to|\-/)[0].trim();
  const spokenMins = parseTimeStringToMinutes(spokenStartPart);

  if (spokenMins !== -1) {
    matched = options.find(opt => {
      const startStr = opt.id.split(/to|\-/)[0].trim();
      const startMins = parseTimeStringToMinutes(startStr);
      return startMins === spokenMins;
    });
    if (matched) return matched;
  }
  return null;
};

const matchCategoryOption = (spokenText, options) => {
  if (!spokenText || !options || !Array.isArray(options)) return null;
  const cleanSpoken = spokenText.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');

  const categoryPhonetic = {
    'general': ['ஜெனரல்'],
    'general medicine': ['ஜெனரல் மெடிசின்', 'ஜெனரல் மெடிசன்'],
    'cardiology': ['கார்டியாலஜி'],
    'pediatrics': ['பீடியாட்ரிக்ஸ்', 'பிடியாட்ரிக்ஸ்'],
    'neurology': ['நியூராலஜி'],
    'dermatology': ['டெர்மடாலஜி'],
    'orthopedics': ['ஆர்த்தோபெடிக்ஸ்'],
    'gynecology': ['கைனகாலஜி'],
    'dental': ['டென்டல்'],
    'dentistry': ['டென்டிஸ்ட்ரி'],
    'ent': ['இஎன்டி', 'ஈஎன்டி', 'இஎண்டி'],
    'ophthalmology': ['ஆப்தல்மாலஜி'],
    'psychiatry': ['சைக்கையாட்ரி'],
    'general surgery': ['ஜெனரல் சர்ஜரி'],
    'urology': ['யூராலஜி'],
    'oncology': ['ஆன்காலஜி'],
    'radiology': ['ரேடியாலஜி']
  };

  // 1. Exact match first
  let found = options.find(opt => {
    const cleanId = (opt.id || '').toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    const cleanOrig = (opt.originalName || '').toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    let tamilPart = '';
    if (opt.label && opt.label.includes('/')) {
      tamilPart = opt.label.split('/')[1].toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    }

    let isPhoneticMatch = false;
    const key = (opt.originalName || '').toLowerCase();
    if (categoryPhonetic[key]) {
      isPhoneticMatch = categoryPhonetic[key].some(p => cleanSpoken === p.replace(/[^a-z0-9\u0B80-\u0BFF]/g, ''));
    }

    return cleanSpoken === cleanId || cleanSpoken === cleanOrig || (tamilPart && cleanSpoken === tamilPart) || isPhoneticMatch;
  });
  if (found) return found;

  // 2. Substring match
  found = options.find(opt => {
    const cleanId = (opt.id || '').toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    const cleanOrig = (opt.originalName || '').toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    const cleanLabel = (opt.label || '').toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    let tamilPart = '';
    if (opt.label && opt.label.includes('/')) {
      tamilPart = opt.label.split('/')[1].toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    }

    let isPhoneticMatch = false;
    const key = (opt.originalName || '').toLowerCase();
    if (categoryPhonetic[key]) {
      isPhoneticMatch = categoryPhonetic[key].some(p => cleanSpoken.includes(p.replace(/[^a-z0-9\u0B80-\u0BFF]/g, '')));
    }

    return cleanId.includes(cleanSpoken) ||
      cleanOrig.includes(cleanSpoken) ||
      cleanLabel.includes(cleanSpoken) ||
      cleanSpoken.includes(cleanId) ||
      cleanSpoken.includes(cleanOrig) ||
      (tamilPart && cleanSpoken.includes(tamilPart)) ||
      isPhoneticMatch;
  });
  return found;
};

const matchDoctorOption = (spokenText, options) => {
  if (!spokenText || !options || !Array.isArray(options)) return null;
  const cleanSpoken = spokenText.toLowerCase()
    .replace(/\bdr\.?\b/g, '')
    .replace(/டாக்டர்/g, '')
    .replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');

  // 1. Exact match
  let found = options.find(opt => {
    const cleanName = (opt.name || '').toLowerCase()
      .replace(/\bdr\.?\b/g, '')
      .replace(/டாக்டர்/g, '')
      .replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    let tamilPart = '';
    if (opt.label && opt.label.includes('/')) {
      tamilPart = opt.label.split('/')[1].split('\n')[0].toLowerCase()
        .replace(/\bdr\.?\b/g, '')
        .replace(/டாக்டர்/g, '')
        .replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    }
    return cleanSpoken === cleanName || (tamilPart && cleanSpoken === tamilPart);
  });
  if (found) return found;

  // 2. Substring match
  found = options.find(opt => {
    const cleanName = (opt.name || '').toLowerCase()
      .replace(/\bdr\.?\b/g, '')
      .replace(/டாக்டர்/g, '')
      .replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    const cleanLabel = (opt.label || '').toLowerCase()
      .replace(/\bdr\.?\b/g, '')
      .replace(/டாக்டர்/g, '')
      .replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    let tamilPart = '';
    if (opt.label && opt.label.includes('/')) {
      tamilPart = opt.label.split('/')[1].split('\n')[0].toLowerCase()
        .replace(/\bdr\.?\b/g, '')
        .replace(/டாக்டர்/g, '')
        .replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
    }
    return cleanName.includes(cleanSpoken) ||
      cleanLabel.includes(cleanSpoken) ||
      cleanSpoken.includes(cleanName) ||
      (tamilPart && cleanSpoken.includes(tamilPart));
  });
  return found;
};

const getBilingualDoctorName = (name) => {
  if (!name) return '';
  const cleanName = name.toLowerCase().trim();

  const mapping = {
    'mohan': { en: 'Dr. Mohan', ta: 'டாக்டர் மோகன்' },
    'danny': { en: 'Dr. Danny', ta: 'டாக்டர் டேனி' },
    'jack': { en: 'Dr. Jack', ta: 'டாக்டர் ஜாக்' },
    'john': { en: 'Dr. John', ta: 'டாக்டர் ஜான்' },
    'deva': { en: 'Dr. Deva', ta: 'டாக்டர் தேவா' },
    'bala': { en: 'Dr. Bala', ta: 'டாக்டர் பாலா' },
    'vijay': { en: 'Dr. Vijay', ta: 'டாக்டர் விஜய்' },
    'anu': { en: 'Dr. Anu', ta: 'டாக்டர் அனு' },
    'kumar': { en: 'Dr. Kumar', ta: 'டாக்டர் குமார்' }
  };

  for (const key of Object.keys(mapping)) {
    if (cleanName.includes(key)) {
      return `${mapping[key].en} / ${mapping[key].ta}`;
    }
  }

  const capName = name.charAt(0).toUpperCase() + name.slice(1);
  return `Dr. ${capName}`;
};

const CalendarView = ({ availableDates, onSelect }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    if (availableDates && availableDates.length > 0) {
      const [y, m, d] = availableDates[0].id.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const grid = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    grid.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateString: null
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    grid.push({
      day: d,
      isCurrentMonth: true,
      dateString: dStr
    });
  }

  const totalSlots = Math.ceil(grid.length / 7) * 7;
  const nextMonthPadding = totalSlots - grid.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    grid.push({
      day: i,
      isCurrentMonth: false,
      dateString: null
    });
  }

  const today = new Date();
  const isToday = (day) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <View style={[styles.calendarCard, { width: '100%', alignSelf: 'center' }]}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={handlePrevMonth} style={styles.calNavBtn}>
          <Icon name="chevron-left" size={24} color="#1C3E55" />
        </TouchableOpacity>
        <Text style={styles.calendarHeaderTitle}>
          {monthNames[month]} {year}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
          <Icon name="chevron-right" size={24} color="#1C3E55" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysRow}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
          <Text key={idx} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {grid.map((cell, idx) => {
          const isAvailable = cell.dateString && availableDates.some(ad => ad.id === cell.dateString);
          const matchedOpt = isAvailable ? availableDates.find(ad => ad.id === cell.dateString) : null;
          const isCellToday = cell.isCurrentMonth && isToday(cell.day);

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayCell,
                !cell.isCurrentMonth && styles.dayCellOutside
              ]}
              disabled={!isAvailable}
              onPress={() => onSelect(matchedOpt)}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.dayText,
                  !cell.isCurrentMonth && styles.dayTextOutside,
                  isAvailable ? styles.dayTextAvailable : styles.dayTextDisabled,
                  isCellToday && styles.dayTextToday
                ]}
              >
                {cell.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const ChatbotScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  // Live Date Time State
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResetChatbot = () => {
    Alert.alert(
      "Reset Chat",
      "Are you sure you want to restart the booking process?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restart", onPress: () => {
            isLoadedRef.current = false;
            setTimeout(async () => {
              try {
                await AsyncStorage.multiRemove([
                  ('@drz_chatbot_messages_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')),
                  ('@drz_chatbot_step_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')),
                  ('@drz_chatbot_patient_data_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')),
                  ('@drz_chatbot_options_' + (user?.contactNumber || user?.mobile || user?.id || 'guest'))
                ]);
              } catch (e) { }
              setPatientData({
                name: '',
                age: '',
                gender: '',
                whatsapp: '',
                selectedDateId: '',
                selectedDateFormatted: '',
                categoryOriginalName: '',
                categoryFullDept: '',
                doctorId: '',
                doctorName: '',
                time: ''
              });
              setHasCompletedInitialFlow(false);
              setCurrentOptions([]);
              setMessages([]);
              setCurrentStep('GREETING');

              setTimeout(() => {
                isLoadedRef.current = true;
                addBotMessage("Hi,\nI am Your DrZ AI Assistant. How Can I Help You Today?\n\nவணக்கம்.\nநான் உங்கள் DrZ AI உதவியாளர். உங்களுக்கு எப்படி உதவலாம்?");
                setTimeout(() => {
                  const greetOptions = [{ id: 'start_booking', label: 'Book an appointment / சந்திப்பை முன்பதிவு செய்யவும்' }];
                  setCurrentOptions(greetOptions);
                  addBotOptions(greetOptions);
                }, 500);
              }, 500);
            }, 300);
          }
        }
      ]
    );
  };

  const formatDateTime = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = months[date.getMonth()];
    const yyyy = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
    return `${day}, ${dd} ${mm} ${yyyy} | ${strTime}`;
  };

  // Basic states
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef(null);

  // Chatbot State Machine
  const [currentStep, setCurrentStep] = useState('GREETING');
  const [hasCompletedInitialFlow, setHasCompletedInitialFlow] = useState(false);

  // Collected Data
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: '',
    whatsapp: '',
    selectedDateId: '',      // YYYY-MM-DD
    selectedDateFormatted: '', // DD/MM/YYYY
    categoryOriginalName: '',
    categoryFullDept: '',
    doctorId: '',
    doctorName: '',
    time: ''
  });

  // DB caching
  const [approvedSchedules, setApprovedSchedules] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);

  // Dynamic Options (rendered in chat as buttons)
  const [currentOptions, setCurrentOptions] = useState([]);

  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const currentOptionsRef = useRef(currentOptions);
  currentOptionsRef.current = currentOptions;

  const handleOptionSelectRef = useRef(null);
  const handleSendRef = useRef(null);
  const isLoadedRef = useRef(false);

  // Setup Voice and TTS
  useEffect(() => {
    // TTS config
    if (isTtsAvailable) {
      try {
        Tts.setDefaultLanguage('en-IN');
        Tts.setDefaultRate(0.5);
        Tts.setDefaultPitch(1.0);
      } catch (e) {
        console.log('TTS Init Error:', e);
      }
    }

    // Voice config
    if (isVoiceAvailable) {
      try {
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechError = (e) => {
          console.log('Voice Error:', e.error);
          setIsListening(false);
        };
        Voice.onSpeechResults = (e) => {
          if (e.value && e.value.length > 0) {
            const step = currentStepRef.current;
            const options = currentOptionsRef.current;

            // 1. Voice Command to Start Booking (Greeting Step)
            if (step === 'GREETING') {
              let matched = false;
              for (const text of e.value) {
                const cleanText = text.toLowerCase();
                if (cleanText.includes('book') || cleanText.includes('appointment') || cleanText.includes('முன்பதிவு') || cleanText.includes('சந்திப்பு')) {
                  matched = true;
                  break;
                }
              }
              if (matched) {
                const startBookingOption = { id: 'start_booking', label: 'Book an appointment / சந்திப்பை முன்பதிவு செய்யவும்' };
                if (handleOptionSelectRef.current) {
                  handleOptionSelectRef.current(startBookingOption);
                  return;
                }
              }
            }

            if (step === 'ASK_NAME' || step === 'EDITING_NAME') {
              const text = e.value[0];
              if (text && text.trim().length >= 2) {
                const isTamil = /[\u0B80-\u0BFF]/.test(text);
                const sourceLang = isTamil ? 'ta' : 'en';
                const targetLang = isTamil ? 'en' : 'ta';

                axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text.trim())}`)
                  .then(res => {
                    let translated = '';
                    try {
                      if (Array.isArray(res.data) && Array.isArray(res.data[0]) && Array.isArray(res.data[0][0])) {
                        translated = String(res.data[0][0][0]).trim();
                      }
                    } catch (e) {
                      console.error("Parse error:", e);
                    }

                    let finalName = text.trim();
                    if (translated && translated !== '' && translated !== text.trim() && translated !== 'null' && translated !== 'undefined') {
                      const engPart = isTamil ? translated : text.trim();
                      finalName = engPart;
                    }

                    if (handleSendRef.current) {
                      handleSendRef.current(finalName);
                    }
                  })
                  .catch(err => {
                    console.error("Translate error:", err);
                    if (handleSendRef.current) {
                      handleSendRef.current(text.trim());
                    }
                  });
                return;
              }
            }

            if (step === 'ASK_AGE' || step === 'EDITING_AGE') {
              let parsedAge = null;
              for (const text of e.value) {
                const converted = convertSpokenNumber(text);
                const ageNum = parseInt(converted, 10);
                if (!isNaN(ageNum) && ageNum > 0 && ageNum <= 120) {
                  parsedAge = converted;
                  break;
                }
              }
              if (parsedAge && handleSendRef.current) {
                handleSendRef.current(parsedAge);
                return;
              } else {
                Alert.alert("Voice Match Error", "Could not recognize age. Please say a valid number (e.g. '25').");
                return;
              }
            }

            if (step === 'ASK_GENDER' || step === 'EDITING_GENDER') {
              let matched = null;
              for (const text of e.value) {
                const optIndex = matchNumberFromSpokenText(text);
                if (optIndex >= 1 && optIndex <= options.length) {
                  matched = options[optIndex - 1];
                  break;
                }
                const cleanText = text.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                matched = options.find(opt => {
                  const cleanLabel = opt.label.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                  const cleanId = opt.id.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                  let tamilPart = '';
                  if (opt.label && opt.label.includes('/')) {
                    tamilPart = opt.label.split('/')[1].toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                  }

                  const phonetics = {
                    'male': ['மேல்', 'மெயில்', 'மெல்'],
                    'female': ['ஃபீமேல்', 'பீமேல்', 'பிமேல்', 'பிமெல்'],
                    'others': ['அதர்ஸ்']
                  };
                  let isPhoneticMatch = false;
                  const key = opt.id.toLowerCase();
                  if (phonetics[key]) {
                    isPhoneticMatch = phonetics[key].some(p => cleanText.includes(p.replace(/[^a-z0-9\u0B80-\u0BFF]/g, '')));
                  }

                  return cleanLabel.includes(cleanText) ||
                    cleanText.includes(cleanId) ||
                    (tamilPart && cleanText.includes(tamilPart)) ||
                    isPhoneticMatch;
                });
                if (matched) break;
              }
              if (matched && handleOptionSelectRef.current) {
                handleOptionSelectRef.current(matched);
                return;
              } else {
                Alert.alert("Voice Match Error", "Could not match gender option. Please say 'Male', 'Female', or 'Others', or say the option number.");
                return;
              }
            }

            if (step === 'ASK_WHATSAPP' || step === 'EDITING_WHATSAPP') {
              let whatsappVal = null;
              for (const text of e.value) {
                const cleanText = text.toLowerCase().trim();
                if (cleanText === 'skip' || cleanText.includes('ஸ்கிப்') || cleanText.includes('தவிர்') || cleanText.includes('வேண்டாம்')) {
                  whatsappVal = 'skip';
                  break;
                }
                const digits = cleanText.replace(/\D/g, '');
                if (digits.length >= 5) {
                  whatsappVal = digits;
                  break;
                }
              }
              if (whatsappVal && handleSendRef.current) {
                handleSendRef.current(whatsappVal);
                return;
              } else {
                Alert.alert("Voice Match Error", "Could not recognize WhatsApp number. Please speak your 10-digit number clearly or say 'skip'.");
                return;
              }
            }

            // 3. Appointment Booking Fields (Date, Category, Doctor, Time, Confirmation)
            if (step === 'ASK_DATE' || step === 'ASK_CATEGORY' || step === 'ASK_DOCTOR' || step === 'ASK_TIME' || step === 'ASK_CONFIRMATION') {
              let matched = null;
              for (const text of e.value) {
                if (step === 'ASK_CATEGORY' || step === 'ASK_DOCTOR' || step === 'ASK_TIME' || step === 'ASK_CONFIRMATION') {
                  const optIndex = matchNumberFromSpokenText(text);
                  if (optIndex >= 1 && optIndex <= options.length) {
                    matched = options[optIndex - 1];
                    break;
                  }
                }

                if (step === 'ASK_DATE') {
                  matched = matchDateOption(text, options);
                } else if (step === 'ASK_CATEGORY') {
                  matched = matchCategoryOption(text, options);
                } else if (step === 'ASK_DOCTOR') {
                  matched = matchDoctorOption(text, options);
                } else if (step === 'ASK_TIME') {
                  matched = matchTimeOption(text, options);
                } else if (step === 'ASK_CONFIRMATION') {
                  const cleanText = text.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                  matched = options.find(opt => {
                    const cleanLabel = opt.label.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                    const cleanId = opt.id.toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                    let tamilPart = '';
                    if (opt.label && opt.label.includes('/')) {
                      tamilPart = opt.label.split('/')[1].toLowerCase().replace(/[^a-z0-9\u0B80-\u0BFF]/g, '');
                    }

                    const confPhonetics = {
                      'confirm_booking': ['கன்பார்ம்', 'கன்ஃபார்ம்', 'உறுதி'],
                      'cancel_booking': ['கேன்சல்', 'கான்சல்', 'ரத்து']
                    };
                    let isPhoneticMatch = false;
                    const key = opt.id.toLowerCase();
                    if (confPhonetics[key]) {
                      isPhoneticMatch = confPhonetics[key].some(p => cleanText.includes(p.replace(/[^a-z0-9\u0B80-\u0BFF]/g, '')));
                    }

                    return cleanLabel.includes(cleanText) ||
                      cleanText.includes(cleanId) ||
                      (tamilPart && cleanText.includes(tamilPart)) ||
                      isPhoneticMatch;
                  });
                }
                if (matched) break;
              }

              if (matched && handleOptionSelectRef.current) {
                handleOptionSelectRef.current(matched);
              } else {
                let errorMsg = "Could not match option.";
                if (step === 'ASK_DATE') {
                  errorMsg = "Could not match the date. Please try speaking the date again (e.g., '15 August 2026' or '15/08/2026').";
                } else if (step === 'ASK_CATEGORY') {
                  errorMsg = "Could not match the category name. Please try speaking the category name again.";
                } else if (step === 'ASK_DOCTOR') {
                  errorMsg = "Could not match the doctor's name. Please try speaking the doctor's name again.";
                } else if (step === 'ASK_TIME') {
                  errorMsg = "Could not match the time slot. Please try speaking the start time again (e.g., '1:00 PM').";
                } else if (step === 'ASK_CONFIRMATION') {
                  errorMsg = "Could not match confirmation option. Please say the option number or say 'Confirm Booking'.";
                }
                Alert.alert("Voice Match Error", errorMsg);
              }
            } else {
              const text = e.value[0];
              setInputText(text);
            }
          }
        };
      } catch (e) {
        console.log('Voice Init Error:', e);
      }
    }

    return () => {
      if (isVoiceAvailable) {
        try {
          Voice.destroy().then(Voice.removeAllListeners);
        } catch (e) {
          console.log('Voice Cleanup Error:', e);
        }
      }
      if (isTtsAvailable) {
        try {
          Tts.stop();
        } catch (e) {
          console.log('TTS Cleanup Error:', e);
        }
      }
    };
  }, []);

  // Initialize Chat and Load State if present
  useEffect(() => {
    const loadStateAndInit = async () => {
      await fetchInitialData();
      try {
        const savedMessages = await AsyncStorage.getItem(('@drz_chatbot_messages_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
        const savedStep = await AsyncStorage.getItem(('@drz_chatbot_step_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
        const savedPatientData = await AsyncStorage.getItem(('@drz_chatbot_patient_data_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
        const savedOptions = await AsyncStorage.getItem(('@drz_chatbot_options_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));

        if (savedMessages && savedStep) {
          setMessages(JSON.parse(savedMessages));
          setCurrentStep(savedStep);
          if (savedPatientData) {
            const parsed = JSON.parse(savedPatientData);
            setPatientData(parsed);
            if (parsed.time) {
              setHasCompletedInitialFlow(true);
            }
          }
          if (savedOptions) setCurrentOptions(JSON.parse(savedOptions));
        } else {
          // Initial Greeting
          setTimeout(() => {
            addBotMessage("Hi,\nI am Your DrZ AI Assistant. How Can I Help You Today?\n\nவணக்கம்.\nநான் உங்கள் DrZ AI உதவியாளர். உங்களுக்கு எப்படி உதவலாம்?");
            setTimeout(() => {
              const greetOptions = [{ id: 'start_booking', label: 'Book an appointment / சந்திப்பை முன்பதிவு செய்யவும்' }];
              setCurrentOptions(greetOptions);
              addBotOptions(greetOptions);
            }, 500);
          }, 500);
        }
      } catch (err) {
        console.error("Error loading chatbot state:", err);
      } finally {
        isLoadedRef.current = true;
      }
    };
    loadStateAndInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist chat state whenever it changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const saveState = async () => {
      try {
        if (messages.length > 0) {
          await AsyncStorage.setItem(('@drz_chatbot_messages_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')), JSON.stringify(messages));
        }
        await AsyncStorage.setItem(('@drz_chatbot_step_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')), currentStep);
        await AsyncStorage.setItem(('@drz_chatbot_patient_data_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')), JSON.stringify(patientData));
        await AsyncStorage.setItem(('@drz_chatbot_options_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')), JSON.stringify(currentOptions));
      } catch (err) {
        console.error("Error saving chatbot state:", err);
      }
    };
    saveState();
  }, [messages, currentStep, patientData, currentOptions]);

  const fetchInitialData = async () => {
    try {
      const today = new Date();
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Fetch all schedules and doctors
      const [schedulesRes, doctorsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/schedules`),
        axios.get(`${API_BASE_URL}/api/doctors`)
      ]);

      const doctorsList = doctorsRes.data || [];
      setAllDoctors(doctorsList);

      // Filter: status is Approved and date is today or future
      const approved = (schedulesRes.data || []).filter(s => {
        if (s.status !== 'Approved') return false;
        // Verify doctor still exists
        const docExists = doctorsList.some(doc =>
          doc._id === s.doctorId || doc.id === s.doctorId || doc.doctorName === s.doctorName
        );
        return docExists && s.date >= todayString;
      });
      setApprovedSchedules(approved);

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Extract unique dates that have approved schedules and at least one future slot if it's today
      const uniqueDates = [...new Set(approved.map(s => s.date))].sort().filter(dStr => {
        if (dStr !== todayString) return true;
        const todaySchedules = approved.filter(s => s.date === todayString);
        return todaySchedules.some(s => {
          const times = s.time || [];
          return times.some(t => {
            const startStr = t.split('to')[0].split('-')[0].trim();
            const startMins = parseTimeStringToMinutes(startStr);
            return startMins > currentMinutes;
          });
        });
      });

      const formattedDates = uniqueDates.map(dStr => {
        const [y, m, d] = dStr.split('-');
        return {
          id: dStr, // YYYY-MM-DD
          formatted: `${d}/${m}/${y}`, // DD/MM/YYYY
          label: `${d}/${m}/${y}`
        };
      });
      setAvailableDates(formattedDates);

    } catch (error) {
      console.log("Error fetching schedules/doctors:", error);
    }
  };

  const speak = async (text) => {
    if (!isTtsAvailable) return null;
    try {
      await Tts.stop();

      let englishPart = '';
      let tamilPart = '';

      const doubleLines = text.split('\n\n');
      for (const segment of doubleLines) {
        if (!segment.trim()) continue;

        if (segment.includes(' / ')) {
          const subParts = segment.split(' / ');
          for (const sub of subParts) {
            const cleanSub = sub.trim();
            if (!cleanSub) continue;
            if (/[\u0B80-\u0BFF]/.test(cleanSub)) {
              tamilPart += ' ' + cleanSub;
            } else {
              englishPart += ' ' + cleanSub;
            }
          }
        } else if (segment.includes('/') && !segment.includes('://')) {
          const subParts = segment.split('/');
          for (const sub of subParts) {
            const cleanSub = sub.trim();
            if (!cleanSub) continue;
            if (/[\u0B80-\u0BFF]/.test(cleanSub)) {
              tamilPart += ' ' + cleanSub;
            } else {
              englishPart += ' ' + cleanSub;
            }
          }
        } else {
          if (/[\u0B80-\u0BFF]/.test(segment)) {
            tamilPart += '\n' + segment;
          } else {
            englishPart += '\n' + segment;
          }
        }
      }

      englishPart = englishPart.trim();
      tamilPart = tamilPart.trim();

      let lastUtteranceId = null;

      if (englishPart) {
        await Tts.setDefaultLanguage('en-IN');
        const cleanEnglish = englishPart.replace(/[^a-zA-Z0-9\s.,?!']/g, "");
        if (cleanEnglish.trim()) {
          lastUtteranceId = await Tts.speak(cleanEnglish);
        }
      }

      if (tamilPart) {
        await Tts.setDefaultLanguage('ta-IN');
        const cleanTamil = tamilPart.replace(/[^\u0B80-\u0BFF0-9\s.,?!]/g, "");
        if (cleanTamil.trim()) {
          lastUtteranceId = await Tts.speak(cleanTamil);
        }
      }

      return lastUtteranceId;
    } catch (e) {
      console.warn("TTS Error:", e);
      return null;
    }
  };

  const addBotMessage = async (text) => {
    setMessages(prev => [...prev, { id: getUniqueId(), text, isUser: false, type: 'text' }]);
    return await speak(text);
  };

  const addUserMessage = (text, isCategory = false, stepName = currentStep) => {
    setMessages(prev => [...prev, { id: getUniqueId(), text, isUser: true, type: 'text', isCategory, step: stepName }]);
  };

  const addBotOptions = (options) => {
    setMessages(prev => [...prev, { id: getUniqueId(), options, isUser: false, type: 'options' }]);
  };

  const showUpdatedConfirmationSummary = (data) => {
    // Add the structured confirmation summary card
    setMessages(prev => [...prev, {
      id: getUniqueId(),
      isUser: false,
      type: 'confirmation_summary',
      patientData: data
    }]);

    const confirmOptions = [
      { id: 'confirm_booking', label: '1. Confirm Booking / முன்பதிவை உறுதிப்படுத்தவும்' },
      { id: 'cancel_booking', label: '2. Cancel Booking / முன்பதிவை ரத்துசெய்யவும்' }
    ];

    const announceText =
      `📋 Confirming Your Appointment Details / முன்பதிவு விவரங்கள்:\n` +
      `• Patient Name / பெயர்: ${data.name}\n` +
      `• Age / வயது: ${data.age}\n` +
      `• Gender / பாலினம்: ${data.gender}\n` +
      `• WhatsApp / வாட்ஸ்அப்: ${data.whatsapp || 'N/A'}\n` +
      `• Date / தேதி: ${data.selectedDateFormatted}\n` +
      `• Category / பிரிவு: ${data.categoryOriginalName}\n` +
      `• Doctor / மருத்துவர்: ${data.doctorName}\n` +
      `• Time / நேரம்: ${data.time}\n\n` +
      `Please click the edit icon next to any detail to change it, or click the button below to Confirm.\n\n` +
      `விவரங்களை மாற்ற அருகிலுள்ள திருத்து பொத்தானை அழுத்தவும், அல்லது முன்பதிவை உறுதிப்படுத்த கீழே உள்ள பொத்தானை அழுத்தவும்.`;

    speak(announceText);
    setCurrentOptions(confirmOptions);
    addBotOptions(confirmOptions);
  };

  const handleEditField = async (field, overrideData = null) => {
    const currentData = overrideData || patientData;
    const isConfirmationActive = hasCompletedInitialFlow;

    if (field === 'name') {
      setInputText(currentData.name || '');
      addBotMessage(isConfirmationActive ? "Please enter the new Patient Name:\n\nபுதிய நோயாளியின் பெயரை உள்ளிடவும்:" : "Please enter the Patient Name:\n\nநோயாளியின் பெயரை உள்ளிடவும்:");
      setCurrentOptions([]);
      setCurrentStep(isConfirmationActive ? 'EDITING_NAME' : 'ASK_NAME');
    } else if (field === 'age') {
      setInputText(currentData.age || '');
      addBotMessage(isConfirmationActive ? "Please enter the new Age:\n\nபுதிய வயதை உள்ளிடவும்:" : "How old is the patient?\n\nநோயாளியின் வயது என்ன?");
      setCurrentOptions([]);
      setCurrentStep(isConfirmationActive ? 'EDITING_AGE' : 'ASK_AGE');
    } else if (field === 'gender') {
      setInputText('');
      const genderOptions = [
        { id: 'Male', label: '1. Male / ஆண்', icon: 'face-man' },
        { id: 'Female', label: '2. Female / பெண்', icon: 'face-woman' },
        { id: 'Others', label: '3. Others / மற்றவை', icon: 'gender-non-binary' }
      ];
      const announceText = (isConfirmationActive ? "Please select the new Gender:\n\nபுதிய பாலினத்தைத் தேர்ந்தெடுக்கவும்:\n\n" : "Please select patient's gender.\n\nபாலினத்தை தேர்வு செய்யவும்.\n\n") +
        genderOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
      addBotMessage(announceText);
      setCurrentOptions(genderOptions);
      addBotOptions(genderOptions);
      setCurrentStep(isConfirmationActive ? 'EDITING_GENDER' : 'ASK_GENDER');
    } else if (field === 'whatsapp') {
      setInputText(currentData.whatsapp || '');
      addBotMessage(isConfirmationActive ? "Please enter the new WhatsApp number (or 'Skip'):\n\nபுதிய வாட்ஸ்அப் எண்ணை உள்ளிடவும் (அல்லது 'Skip'):" : "Enter WhatsApp number (Optional, type 'Skip' to skip).\n\nவாட்ஸ்அப் எண் (தேவைப்பட்டால் மட்டும், தவிர்க்க 'Skip' என டைப் செய்யவும்):");
      setCurrentOptions([]);
      setCurrentStep(isConfirmationActive ? 'EDITING_WHATSAPP' : 'ASK_WHATSAPP');
    } else if (field === 'date') {
      setInputText('');
      fetchInitialData();
      setMessages(prev => [...prev, {
        id: getUniqueId(),
        text: isConfirmationActive ? "Please Select the new Date\n\nபுதிய தேதியைத் தேர்ந்தெடுக்கவும்." : "Please Select Date\n\nதேதியை தேர்ந்தெடுக்கவும்.",
        isUser: false,
        type: 'calendar',
        availableDates: availableDates
      }]);
      speak(isConfirmationActive ? "Please Select the new Date\n\nபுதிய தேதியைத் தேர்ந்தெடுக்கவும்." : "Please Select Date\n\nதேதியை தேர்ந்தெடுக்கவும்.");
      setCurrentOptions(availableDates);
      setCurrentStep(isConfirmationActive ? 'EDITING_DATE' : 'ASK_DATE');
    } else if (field === 'category') {
      setInputText('');
      const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
      const depts = new Set();
      schedulesForDate.forEach(s => {
        if (s.department) {
          s.department.split(',').forEach(dep => depts.add(dep.trim()));
        }
      });
      const departmentTranslations = {
        "General": "பொது",
        "General Medicine": "பொது மருத்துவம்",
        "Cardiology": "கார்டியாலஜி",
        "Pediatrics": "குழந்தைகள் மருத்துவம்",
        "Neurology": "நரம்பியல்",
        "Dermatology": "தோல் மருத்துவம்",
        "Orthopedics": "எலும்பியல்",
        "Gynecology": "மகப்பேறு மருத்துவம்",
        "Dental": "பல் மருத்துவம்",
        "Dentistry": "பல் மருத்துவம்",
        "ENT": "காது மூக்கு தொண்டை",
        "Ophthalmology": "கண் மருத்துவம்",
        "Psychiatry": "மனநல மருத்துவம்",
        "General Surgery": "பொது அறுவை சிகிச்சை",
        "Urology": "சிறுநீரகவியல்",
        "Oncology": "புற்றுநோயியல்",
        "Radiology": "கதிரியக்கவியல்",
        "Others": "மற்றவை",
        "Psychotherapy": "உளவியல் சிகிச்சை"
      };
      const deptOptions = Array.from(depts).map((d, index) => {
        const englishPart = d.split('/')[0].trim();
        let tamilPart = d.split('/')[1] ? d.split('/')[1].trim() : '';
        if (!tamilPart) {
          const foundKey = Object.keys(departmentTranslations).find(k => k.toLowerCase() === englishPart.toLowerCase());
          tamilPart = foundKey ? departmentTranslations[foundKey] : '';
        }
        return {
          id: d,
          label: `${index + 1}. ${tamilPart ? `${englishPart} / ${tamilPart}` : englishPart}`,
          originalName: englishPart
        };
      });
      const announceText = (isConfirmationActive ? "Please select the new Treatment Category:\n\nபுதிய சிகிச்சை வகையைத் தேர்ந்தெடுக்கவும்:\n\n" : "Please select Treatment category.\n\nசிகிச்சை பிரிவை தேர்வு செய்யவும்.\n\n") +
        deptOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
      addBotMessage(announceText);
      setCurrentOptions(deptOptions);
      addBotOptions(deptOptions);
      setCurrentStep(isConfirmationActive ? 'EDITING_CATEGORY' : 'ASK_CATEGORY');
    } else if (field === 'doctor') {
      setInputText('');
      const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
      const schedulesForCat = schedulesForDate.filter(s => {
        if (!s.department) return currentData.categoryOriginalName === 'Others';
        return s.department.split(',').map(d => d.trim()).includes(currentData.categoryFullDept);
      });
      const activeDocs = allDoctors.filter(doc =>
        schedulesForCat.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
      );
      const docOptions = activeDocs.map((d, index) => ({
        id: d._id || d.id,
        name: d.doctorName,
        label: `${index + 1}. ${getBilingualDoctorName(d.doctorName)}\nexperience: ${d.experience || 'N/A'} Yrs Exp`
      }));
      const announceText = (isConfirmationActive ? "Please select the new Doctor:\n\nபுதிய மருத்துவரைத் தேர்ந்தெடுக்கவும்:\n\n" : "Please select a Doctor.\n\nமருத்துவரை தேர்ந்தெடுக்கவும்.\n\n") +
        docOptions.map((opt, index) => {
          const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').replace('\n', ' ');
          return `Option ${index + 1}: ${cleanLabel}`;
        }).join('\n');
      addBotMessage(announceText);
      setCurrentOptions(docOptions);
      addBotOptions(docOptions);
      setCurrentStep(isConfirmationActive ? 'EDITING_DOCTOR' : 'ASK_DOCTOR');
    } else if (field === 'time') {
      setInputText('');
      addBotMessage("Checking available slots... / நேரங்கள் சரிபார்க்கப்படுகின்றன...");
      try {
        const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
        const schedulesForDoctor = schedulesForDate.filter(s =>
          s.doctorId === currentData.doctorId || s.doctorName === currentData.doctorName
        );
        const allTimings = schedulesForDoctor.flatMap(s => s.time || []);
        const uniqueTimings = [...new Set(allTimings)];
        const response = await axios.get(`${API_BASE_URL}/api/emails/booked-timings?appointment_date=${encodeURIComponent(currentData.selectedDateFormatted)}&_t=${Date.now()}`);
        const appointments = response.data || [];
        const bookedMap = {};
        appointments.forEach(app => {
          if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
          const docName = (app.doctor_name || '').trim();
          if (!bookedMap[docName]) bookedMap[docName] = [];
          bookedMap[docName].push((app.appointment_time || '').trim());
        });
        const targetDocName = (currentData.doctorName || '').trim();
        const bookedTimings = bookedMap[targetDocName] || [];
        let availableTimings = uniqueTimings.filter(t => {
          const tTrim = t.trim();
          if (bookedTimings.includes(tTrim)) return false;
          const startMins = parseTimeStringToMinutes(tTrim.split(/to|\-/)[0].trim());
          return !bookedTimings.some(booked => {
            const bookedMins = parseTimeStringToMinutes(booked);
            return bookedMins !== -1 && startMins !== -1 && bookedMins === startMins;
          });
        });
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (currentData.selectedDateId === todayString) {
          const currentMinutes = today.getHours() * 60 + today.getMinutes();
          availableTimings = availableTimings.filter(t => {
            const startStr = t.split('to')[0].split('-')[0].trim();
            const startMins = parseTimeStringToMinutes(startStr);
            return startMins > currentMinutes;
          });
        }

        const timeOpts = availableTimings.map((t, index) => ({
          id: t,
          label: `${index + 1}. ${t}`
        }));
        const announceText = (isConfirmationActive ? "Please select the new Time slot:\n\nபுதிய நேரத்தைத் தேர்ந்தெடுக்கவும்:\n\n" : "Please select an available Time.\n\nநேரத்தை தேர்ந்தெடுக்கவும்.\n\n") +
          timeOpts.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
        announceText;
        setCurrentOptions(timeOpts);
        addBotOptions(timeOpts);
        setCurrentStep(isConfirmationActive ? 'EDITING_TIME' : 'ASK_TIME');
      } catch (err) {
        console.log(err);
        addBotMessage("Error checking slots. Please try selecting the doctor again.\n\nநேரங்களைச் சரிபார்ப்பதில் பிழை. தயவுசெய்து மருத்துவரை மீண்டும் தேர்ந்தெடுக்க முயற்சிக்கவும்.");
        setCurrentStep('ASK_CONFIRMATION');
      }
    }
  };

  // State Machine processor
  const handleSend = async (textOverride = null) => {
    const text = (textOverride || inputText).trim();
    if (!text && currentStep !== 'OPTIONS') return;

    if (text) {
      addUserMessage(text, currentStep === 'ASK_CATEGORY');
      setInputText('');
    }

    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      await processStep(text);
    }, 1000);
  };
  handleSendRef.current = handleSend;

  const handleOptionSelect = async (option) => {
    const isCategory = !!(option && option.originalName);
    addUserMessage(option.label, isCategory);
    setIsTyping(true);

    setTimeout(async () => {
      setIsTyping(false);
      await processStep(option.id, option);
    }, 1000);
  };
  handleOptionSelectRef.current = handleOptionSelect;

  const matchOption = (input, options) => {
    const normalizedInput = input.toLowerCase().trim();
    return options.find(opt =>
      opt.id.toLowerCase() === normalizedInput ||
      opt.label.toLowerCase().includes(normalizedInput) ||
      (opt.name && opt.name.toLowerCase().includes(normalizedInput))
    );
  };

  const processStep = async (input, optionData = null) => {
    const currentData = patientData;
    let nextStep = currentStep;

    switch (currentStep) {
      case 'GREETING':
        if (input === 'start_booking' || input.toLowerCase().includes('book')) {
          addBotMessage("What is the patient's full name?\n\nநோயாளியின் முழு பெயர் என்ன?");
          nextStep = 'ASK_NAME';
          setCurrentOptions([]);
        } else {
          addBotMessage("Please select the button below to start booking an appointment.\n\nமுன்பதிவைத் தொடங்க கீழே உள்ள பொத்தானைத் தேர்ந்தெடுக்கவும்.");
          addBotOptions(currentOptions);
        }
        break;

      case 'ASK_NAME':
        if (input.length < 2) {
          addBotMessage("Please enter a valid name.\n\nநோயாளியின் பெயரை உள்ளிடவும்.");
          nextStep = 'ASK_NAME';
        } else {
          setPatientData(prev => ({ ...prev, name: input }));
          addBotMessage(`Thanks! How old is the patient?\n\nநோயாளியின் வயது என்ன?`);
          setInputText(currentData.age || '');
          nextStep = 'ASK_AGE';
        }
        break;

      case 'ASK_AGE':
        const ageNum = parseInt(input, 10);
        if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
          addBotMessage("Please enter a valid age (e.g. 25).\n\nநோயாளியின் வயதை சரியாக உள்ளிடவும்.");
          nextStep = 'ASK_AGE';
        } else {
          setPatientData(prev => ({ ...prev, age: input }));
          const genderOptions = [
            { id: 'Male', label: '1. Male / ஆண்', icon: 'face-man' },
            { id: 'Female', label: '2. Female / பெண்', icon: 'face-woman' },
            { id: 'Others', label: '3. Others / மற்றவை', icon: 'gender-non-binary' }
          ];
          const announceText = "Please select patient's gender.\n\nபாலினத்தை தேர்வு செய்யவும்.\n\n" +
            genderOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          setCurrentOptions(genderOptions);
          addBotOptions(genderOptions);
          nextStep = 'ASK_GENDER';
        }
        break;

      case 'ASK_GENDER':
        let selectedGender = optionData ? optionData.id : null;
        if (!selectedGender) {
          const matched = matchOption(input, currentOptions);
          if (matched) selectedGender = matched.id;
        }

        if (!selectedGender) {
          const announceText = "Please select one of the gender options below.\n\nகீழே உள்ள பாலின விருப்பங்களில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'ASK_GENDER';
        } else {
          setPatientData(prev => ({ ...prev, gender: selectedGender }));
          addBotMessage("Enter WhatsApp number (Optional, type 'Skip' to skip).\n\nவாட்ஸ்அப் எண் (தேவைப்பட்டால் மட்டும், தவிர்க்க 'Skip' என டைப் செய்யவும்).");
          setInputText(currentData.whatsapp || '');
          nextStep = 'ASK_WHATSAPP';
          setCurrentOptions([]);
        }
        break;

      case 'ASK_WHATSAPP':
        const whatsappVal = input.toLowerCase() === 'skip' ? '' : input;
        setPatientData(prev => ({ ...prev, whatsapp: whatsappVal }));

        // Date Selection - Only show dates with approved schedules
        if (availableDates.length === 0) {
          addBotMessage("Sorry, there are no available doctor schedules at this time. Please try again later.\n\nமன்னிக்கவும், இந்த நேரத்தில் மருத்துவர் அட்டவணைகள் எதுவும் இல்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.");
          nextStep = 'END';
        } else {
          setMessages(prev => [...prev, {
            id: getUniqueId(),
            text: "Please Select a Date\n\nதேதியை தேர்வு செய்யவும்.",
            isUser: false,
            type: 'calendar',
            availableDates: availableDates
          }]);
          speak("Please Select a Date\n\nதேதியை தேர்வு செய்யவும்.");
          setCurrentOptions(availableDates);
          nextStep = 'ASK_DATE';
        }
        break;

      case 'ASK_DATE':
        let selectedDate = optionData || matchOption(input, currentOptions);
        if (!selectedDate) {
          setMessages(prev => [...prev, {
            id: getUniqueId(),
            text: "Please select one of the scheduled dates below.\n\nகீழே உள்ள அட்டவணை தேதிகளில் ஒன்றை தேர்ந்தெடுக்கவும்.",
            isUser: false,
            type: 'calendar',
            availableDates: availableDates
          }]);
          speak("Please select one of the scheduled dates below.\n\nகீழே உள்ள அட்டவணை தேதிகளில் ஒன்றை தேர்ந்தெடுக்கவும்.");
          nextStep = 'ASK_DATE';
        } else {
          const selectedDateId = selectedDate.id;
          const selectedDateFormatted = selectedDate.formatted;

          // Dynamically find categories scheduled on this date
          const schedulesForDate = approvedSchedules.filter(s => s.date === selectedDateId);
          const depts = new Set();
          schedulesForDate.forEach(s => {
            if (s.department) {
              s.department.split(',').forEach(dep => depts.add(dep.trim()));
            }
          });

          const departmentTranslations = {
            "General": "பொது",
            "General Medicine": "பொது மருத்துவம்",
            "Cardiology": "கார்டியாலஜி",
            "Pediatrics": "குழந்தைகள் மருத்துவம்",
            "Neurology": "நரம்பியல்",
            "Dermatology": "தோல் மருத்துவம்",
            "Orthopedics": "எலும்பியல்",
            "Gynecology": "மகப்பேறு மருத்துவம்",
            "Dental": "பல் மருத்துவம்",
            "Dentistry": "பல் மருத்துவம்",
            "ENT": "காது மூக்கு தொண்டை",
            "Ophthalmology": "கண் மருத்துவம்",
            "Psychiatry": "மனநல மருத்துவம்",
            "General Surgery": "பொது அறுவை சிகிச்சை",
            "Urology": "சிறுநீரகவியல்",
            "Oncology": "புற்றுநோயியல்",
            "Radiology": "கதிரியக்கவியல்",
            "Others": "மற்றவை",
            "Psychotherapy": "உளவியல் சிகிச்சை"
          };

          const deptOptions = Array.from(depts).map((d, index) => {
            const englishPart = d.split('/')[0].trim();
            let tamilPart = d.split('/')[1] ? d.split('/')[1].trim() : '';
            if (!tamilPart) {
              const foundKey = Object.keys(departmentTranslations).find(k => k.toLowerCase() === englishPart.toLowerCase());
              tamilPart = foundKey ? departmentTranslations[foundKey] : '';
            }
            return {
              id: d,
              label: `${index + 1}. ${tamilPart ? `${englishPart} / ${tamilPart}` : englishPart}`,
              originalName: englishPart
            };
          });

          if (deptOptions.length === 0) {
            setMessages(prev => [...prev, {
              id: getUniqueId(),
              text: "No departments scheduled on this date. Please select another date.\n\nஇந்த தேதியில் எந்த பிரிவுகளும் திட்டமிடப்படவில்லை. வேறு தேதியை தேர்ந்தெடுக்கவும்.",
              isUser: false,
              type: 'calendar',
              availableDates: availableDates
            }]);
            speak("No departments scheduled on this date. Please select another date.\n\nஇந்த தேதியில் எந்த பிரிவுகளும் திட்டமிடப்படவில்லை. வேறு தேதியை தேர்ந்தெடுக்கவும்.");
            nextStep = 'ASK_DATE';
          } else {
            setPatientData(prev => ({
              ...prev,
              selectedDateId,
              selectedDateFormatted
            }));
            const announceText = "Please select a Treatment Category.\n\nசிகிச்சை வகையை தேர்ந்தெடுக்கவும்.\n\n" +
              deptOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
            addBotMessage(announceText);
            setCurrentOptions(deptOptions);
            addBotOptions(deptOptions);
            nextStep = 'ASK_CATEGORY';
          }
        }
        break;

      case 'ASK_CATEGORY':
        let selectedCategory = optionData || matchOption(input, currentOptions);
        if (!selectedCategory) {
          const announceText = "Please select one of the categories below.\n\nகீழே உள்ள பிரிவுகளில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'ASK_CATEGORY';
        } else {
          // Filter approved schedules on this date for this category
          const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
          const schedulesForCategory = schedulesForDate.filter(s => {
            if (!s.department) return selectedCategory.originalName === 'Others';
            return s.department.split(',').map(d => d.trim()).includes(selectedCategory.id);
          });

          // Fetch only doctors scheduled for this category on this date
          const activeDocs = allDoctors.filter(doc =>
            schedulesForCategory.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
          );

          const docOptions = activeDocs.map((d, index) => ({
            id: d._id || d.id,
            name: d.doctorName,
            label: `${index + 1}. ${getBilingualDoctorName(d.doctorName)}\nexperience: ${d.experience || 'N/A'} Yrs Exp`
          }));

          if (docOptions.length === 0) {
            addBotMessage("No doctors are available for this category on the selected date. Please choose another category.\n\nதேர்ந்தெடுக்கப்பட்ட தேதியில் இந்த பிரிவுக்கு மருத்துவர்கள் யாரும் இல்லை. தயவுசெய்து வேறு பிரிவைத் தேர்ந்தெடுக்கவும்.");
            addBotOptions(currentOptions); // Reshow categories
            nextStep = 'ASK_CATEGORY';
          } else {
            setPatientData(prev => ({
              ...prev,
              categoryOriginalName: selectedCategory.originalName,
              categoryFullDept: selectedCategory.id
            }));
            const announceText = "Please select a Doctor.\n\nமருத்துவரை தேர்ந்தெடுக்கவும்.\n\n" +
              docOptions.map((opt, index) => {
                const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').replace('\n', ' ');
                return `Option ${index + 1}: ${cleanLabel}`;
              }).join('\n');
            addBotMessage(announceText);
            setCurrentOptions(docOptions);
            addBotOptions(docOptions);
            nextStep = 'ASK_DOCTOR';
          }
        }
        break;

      case 'ASK_DOCTOR':
        let selectedDoc = optionData || matchOption(input, currentOptions);
        if (!selectedDoc) {
          const announceText = "Please select one of the doctors below.\n\nகீழே உள்ள மருத்துவர்களில் ஒருவரை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => {
              const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').replace('\n', ' ');
              return `Option ${index + 1}: ${cleanLabel}`;
            }).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'ASK_DOCTOR';
        } else {
          // Fetch timings for this doctor on this date
          addBotMessage("Checking available slots... / நேரங்கள் சரிபார்க்கப்படுகின்றன...");
          try {
            const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
            const schedulesForDoctor = schedulesForDate.filter(s =>
              s.doctorId === selectedDoc.id || s.doctorName === selectedDoc.name
            );

            const allTimings = schedulesForDoctor.flatMap(s => s.time || []);
            const uniqueTimings = [...new Set(allTimings)];

            // Get booked timings
            const response = await axios.get(`${API_BASE_URL}/api/emails/booked-timings?appointment_date=${encodeURIComponent(currentData.selectedDateFormatted)}&_t=${Date.now()}`);
            const appointments = response.data || [];

            const bookedMap = {};
            appointments.forEach(app => {
              if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
              const docName = (app.doctor_name || '').trim();
              if (!bookedMap[docName]) bookedMap[docName] = [];
              bookedMap[docName].push((app.appointment_time || '').trim());
            });
            const targetDocName = (selectedDoc.name || '').trim();
            const bookedTimings = bookedMap[targetDocName] || [];

            // Exclude booked timings
            let availableTimings = uniqueTimings.filter(t => {
              const tTrim = t.trim();
              if (bookedTimings.includes(tTrim)) return false;
              const startMins = parseTimeStringToMinutes(tTrim.split(/to|\-/)[0].trim());
              return !bookedTimings.some(booked => {
                const bookedMins = parseTimeStringToMinutes(booked);
                return bookedMins !== -1 && startMins !== -1 && bookedMins === startMins;
              });
            });

            // Exclude past timings if the selected date is today
            const today = new Date();
            const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            if (currentData.selectedDateId === todayString) {
              const currentMinutes = today.getHours() * 60 + today.getMinutes();
              availableTimings = availableTimings.filter(t => {
                const startStr = t.split('to')[0].split('-')[0].trim();
                const startMins = parseTimeStringToMinutes(startStr);
                return startMins > currentMinutes;
              });
            }

            if (availableTimings.length === 0) {
              // Reshow doctors
              // Re-filter doctors for reshowing
              const sForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
              const sForCat = sForDate.filter(s => {
                if (!s.department) return currentData.categoryOriginalName === 'Others';
                return s.department.split(',').map(d => d.trim()).includes(currentData.categoryFullDept);
              });
              const activeDocs = allDoctors.filter(doc =>
                sForCat.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
              );
              const docOptions = activeDocs.map((d, index) => ({
                id: d._id || d.id,
                name: d.doctorName,
                label: `${index + 1}. ${getBilingualDoctorName(d.doctorName)}\nexperience: ${d.experience || 'N/A'} Yrs Exp`
              }));
              const announceText = "This doctor is fully booked on this date. Please select another doctor.\n\nஇந்த மருத்துவர் இந்த தேதியில் முழுமையாக முன்பதிவு செய்யப்பட்டுள்ளார். தயவுசெய்து வேறு மருத்துவரை தேர்ந்தெடுக்கவும்.\n\n" +
                docOptions.map((opt, index) => {
                  const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').replace('\n', ' ');
                  return `Option ${index + 1}: ${cleanLabel}`;
                }).join('\n');
              addBotMessage(announceText);
              setCurrentOptions(docOptions);
              addBotOptions(docOptions);
              nextStep = 'ASK_DOCTOR';
            } else {
              const timeOpts = availableTimings.map((t, index) => ({
                id: t,
                label: `${index + 1}. ${t}`
              }));
              setPatientData(prev => ({
                ...prev,
                doctorId: selectedDoc.id,
                doctorName: selectedDoc.name
              }));
              const announceText = "Please select an available Time.\n\nநேரத்தை தேர்ந்தெடுக்கவும்.\n\n" +
                timeOpts.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
              addBotMessage(announceText);
              setCurrentOptions(timeOpts);
              addBotOptions(timeOpts);
              nextStep = 'ASK_TIME';
            }
          } catch (err) {
            console.log(err);
            addBotMessage("Error checking slots. Please try selecting the doctor again.\n\nநேரங்களைச் சரிபார்ப்பதில் பிழை. தயவுசெய்து மருத்துவரை மீண்டும் தேர்ந்தெடுக்க முயற்சிக்கவும்.");
            addBotOptions(currentOptions);
            nextStep = 'ASK_DOCTOR';
          }
        }
        break;

      case 'ASK_TIME':
        let selectedTime = optionData;
        if (!selectedTime) {
          const optIndex = matchNumberFromSpokenText(input);
          if (optIndex >= 1 && optIndex <= currentOptions.length) {
            selectedTime = currentOptions[optIndex - 1];
          } else {
            selectedTime = matchTimeOption(input, currentOptions);
          }
        }
        if (!selectedTime) {
          const announceText = "Please select one of the time slots below.\n\nகீழே உள்ள நேரங்களில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'ASK_TIME';
        } else {
          setPatientData(prev => ({ ...prev, time: selectedTime.id }));
          setHasCompletedInitialFlow(true);
          showUpdatedConfirmationSummary({ ...patientData, time: selectedTime.id });
          nextStep = 'ASK_CONFIRMATION';
        }
        break;

      case 'ASK_CONFIRMATION':
        let selectedOption = optionData || matchOption(input, currentOptions);
        if (!selectedOption) {
          const confirmOptions = [
            { id: 'confirm_booking', label: '1. Confirm Booking / முன்பதிவை உறுதிப்படுத்தவும்' },
            { id: 'edit_name', label: '2. Edit Name / பெயரை மாற்றவும்' },
            { id: 'edit_age', label: '3. Edit Age / வயதை மாற்றவும்' },
            { id: 'edit_gender', label: '4. Edit Gender / பாலினத்தை மாற்றவும்' },
            { id: 'edit_whatsapp', label: '5. Edit WhatsApp / வாட்ஸ்அப் எண்ணை மாற்றவும்' },
            { id: 'edit_date', label: '6. Edit Date / தேதியை மாற்றவும்' },
            { id: 'edit_category', label: '7. Edit Category / பிரிவை மாற்றவும்' },
            { id: 'edit_doctor', label: '8. Edit Doctor / மருத்துவரை மாற்றவும்' },
            { id: 'edit_time', label: '9. Edit Time / நேரத்தை மாற்றவும்' }
          ];
          const announceText = "Please select one of the options below.\n\nகீழே உள்ள விருப்பங்களில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            confirmOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(confirmOptions);
          nextStep = 'ASK_CONFIRMATION';
        } else {
          if (selectedOption.id === 'confirm_booking') {
            // Confirm & Submit Booking!
            const payload = {
              patient_name: patientData.name,
              patient_age: patientData.age,
              patient_gender: patientData.gender,
              whatsapp_number: patientData.whatsapp,
              login_mobile: user?.contactNumber || user?.mobile || "N/A",
              treatment_category: patientData.categoryOriginalName,
              doctor_name: patientData.doctorName,
              appointment_date: patientData.selectedDateFormatted,
              appointment_time: patientData.time,
              video_call: "No",
            };

            const finalSummary =
              `📋 Confirming Your Appointment Details / முன்பதிவு விவரங்கள்:\n` +
              `• Patient Name / பெயர்: ${payload.patient_name}\n` +
              `• Age / வயது: ${payload.patient_age}\n` +
              `• Gender / பாலினம்: ${payload.patient_gender}\n` +
              `• WhatsApp / வாட்ஸ்அப்: ${payload.whatsapp_number || 'N/A'}\n` +
              `• Date / தேதி: ${payload.appointment_date}\n` +
              `• Category / பிரிவு: ${payload.treatment_category}\n` +
              `• Doctor / மருத்துவர்: ${payload.doctor_name}\n` +
              `• Time / நேரம்: ${payload.appointment_time}\n\n` +
              `Booking your appointment... / முன்பதிவு செய்யப்படுகிறது...`;

            addBotMessage(finalSummary);

            try {
              const response = await axios.post(`${API_BASE_URL}/api/emails/book`, payload, {
                headers: { 'Content-Type': 'application/json' }
              });

              if (response.status === 200 || response.data.message) {
                isLoadedRef.current = false;
                try {
                  await AsyncStorage.multiRemove([
                    ('@drz_chatbot_messages_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')),
                    ('@drz_chatbot_step_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')),
                    ('@drz_chatbot_patient_data_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')),
                    ('@drz_chatbot_options_' + (user?.contactNumber || user?.mobile || user?.id || 'guest'))
                  ]);
                } catch (e) {
                  console.error("Error clearing saved chat state:", e);
                }

                const lastId = await addBotMessage(
                  `✅ Appointment Booked Successfully!\n\n` +
                  `📋 Details:\n` +
                  `• Patient: ${payload.patient_name}\n` +
                  `• Date: ${payload.appointment_date}\n` +
                  `• Time: ${payload.appointment_time}\n` +
                  `• Doctor: ${payload.doctor_name}\n\n` +
                  `உங்கள் முன்பதிவு உறுதி செய்யப்பட்டது.`
                );

                const performReset = () => {
                  setPatientData({
                    name: '',
                    age: '',
                    gender: '',
                    whatsapp: '',
                    selectedDateId: '',
                    selectedDateFormatted: '',
                    categoryOriginalName: '',
                    categoryFullDept: '',
                    doctorId: '',
                    doctorName: '',
                    time: ''
                  });
                  setHasCompletedInitialFlow(false);
                  setCurrentOptions([]);
                  setMessages([]);
                  setCurrentStep('GREETING');

                  setTimeout(() => {
                    isLoadedRef.current = true;
                    addBotMessage("Hi,\nI am Your DrZ AI Assistant. How Can I Help You Today?\n\nவணக்கம்.\nநான் உங்கள் DrZ AI உதவியாளர். உங்களுக்கு எப்படி உதவலாம்?");
                    setTimeout(() => {
                      const greetOptions = [{ id: 'start_booking', label: 'Book an appointment / சந்திப்பை முன்பதிவு செய்யவும்' }];
                      setCurrentOptions(greetOptions);
                      addBotOptions(greetOptions);
                    }, 500);
                  }, 500);
                };

                if (!isTtsAvailable) {
                  setTimeout(performReset, 5000);
                } else {
                  let resetDone = false;
                  let ttsSubscription = null;
                  const cleanupTts = () => {
                    if (ttsSubscription) {
                      if (typeof ttsSubscription.remove === 'function') {
                        ttsSubscription.remove();
                      } else if (typeof Tts.removeEventListener === 'function') {
                        try {
                          Tts.removeEventListener('tts-finish', handleFinish);
                        } catch (e) { }
                      }
                    }
                  };
                  const handleFinish = (event) => {
                    const eventUtteranceId = event && (event.utteranceId || event);
                    if (lastId && eventUtteranceId && String(eventUtteranceId) !== String(lastId)) {
                      return;
                    }
                    if (!resetDone) {
                      resetDone = true;
                      cleanupTts();
                      performReset();
                    }
                  };
                  ttsSubscription = Tts.addEventListener('tts-finish', handleFinish);
                  setTimeout(() => {
                    if (!resetDone) {
                      resetDone = true;
                      cleanupTts();
                      performReset();
                    }
                  }, 13000);
                }
                return;
              } else {
                addBotMessage("Failed to book appointment. Please try again later.\n\nமுன்பதிவு செய்ய முடியவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.");
                showUpdatedConfirmationSummary(patientData);
                nextStep = 'ASK_CONFIRMATION';
              }
            } catch (err) {
              console.log(err);
              addBotMessage("Failed to book appointment. Please check your network and try again.\n\nமுன்பதிவு செய்ய முடியவில்லை. நெட்வொர்க்கைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.");
              showUpdatedConfirmationSummary(patientData);
              nextStep = 'ASK_CONFIRMATION';
            }
          } else if (selectedOption.id === 'cancel_booking') {
            addBotMessage("Booking cancelled. Starting over. / முன்பதிவு ரத்து செய்யப்பட்டது. மீண்டும் முதலிலிருந்து தொடங்குகிறது.");
            isLoadedRef.current = false;
            setTimeout(async () => {
              try {
                await AsyncStorage.removeItem(('@drz_chatbot_messages_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
                await AsyncStorage.removeItem(('@drz_chatbot_step_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
                await AsyncStorage.removeItem(('@drz_chatbot_patient_data_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
                await AsyncStorage.removeItem(('@drz_chatbot_options_' + (user?.contactNumber || user?.mobile || user?.id || 'guest')));
              } catch (e) {
                console.log(e);
              }
              setPatientData({
                name: '',
                age: '',
                gender: '',
                whatsapp: '',
                selectedDateId: '',
                selectedDateFormatted: '',
                categoryOriginalName: '',
                categoryFullDept: '',
                doctorId: '',
                doctorName: '',
                time: ''
              });
              setHasCompletedInitialFlow(false);
              setCurrentOptions([]);
              setMessages([]);
              setCurrentStep('GREETING');

              setTimeout(() => {
                isLoadedRef.current = true;
                addBotMessage("Hi,\nI am Your DrZ AI Assistant. How Can I Help You Today?\n\nவணக்கம்.\nநான் உங்கள் DrZ AI உதவியாளர். உங்களுக்கு எப்படி உதவலாம்?");
                setTimeout(() => {
                  const greetOptions = [{ id: 'start_booking', label: 'Book an appointment / சந்திப்பை முன்பதிவு செய்யவும்' }];
                  setCurrentOptions(greetOptions);
                  addBotOptions(greetOptions);
                }, 500);
              }, 500);
            }, 1000);
            return;
          } else if (selectedOption.id === 'edit_name') {
            addBotMessage("Please enter the new Patient Name:\n\nபுதிய நோயாளியின் பெயரை உள்ளிடவும்:");
            setCurrentOptions([]);
            nextStep = 'EDITING_NAME';
          } else if (selectedOption.id === 'edit_age') {
            addBotMessage("Please enter the new Age:\n\nபுதிய வயதை உள்ளிடவும்:");
            setCurrentOptions([]);
            nextStep = 'EDITING_AGE';
          } else if (selectedOption.id === 'edit_gender') {
            const genderOptions = [
              { id: 'Male', label: '1. Male / ஆண்', icon: 'face-man' },
              { id: 'Female', label: '2. Female / பெண்', icon: 'face-woman' },
              { id: 'Others', label: '3. Others / மற்றவை', icon: 'gender-non-binary' }
            ];
            const announceText = "Please select the new Gender:\n\nபுதிய பாலினத்தைத் தேர்ந்தெடுக்கவும்:\n\n" +
              genderOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
            addBotMessage(announceText);
            setCurrentOptions(genderOptions);
            addBotOptions(genderOptions);
            nextStep = 'EDITING_GENDER';
          } else if (selectedOption.id === 'edit_whatsapp') {
            addBotMessage("Please enter the new WhatsApp number (or 'Skip'):\n\nபுதிய வாட்ஸ்அப் எண்ணை உள்ளிடவும் (அல்லது 'Skip'):");
            setCurrentOptions([]);
            nextStep = 'EDITING_WHATSAPP';
          } else if (selectedOption.id === 'edit_date') {
            setMessages(prev => [...prev, {
              id: getUniqueId(),
              text: "Please Select the new Date\n\nபுதிய தேதியைத் தேர்ந்தெடுக்கவும்.",
              isUser: false,
              type: 'calendar',
              availableDates: availableDates
            }]);
            speak("Please Select the new Date\n\nபுதிய தேதியைத் தேர்ந்தெடுக்கவும்.");
            setCurrentOptions(availableDates);
            nextStep = 'ASK_DATE';
          } else if (selectedOption.id === 'edit_category') {
            const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
            const depts = new Set();
            schedulesForDate.forEach(s => {
              if (s.department) {
                s.department.split(',').forEach(dep => depts.add(dep.trim()));
              }
            });
            const departmentTranslations = {
              "General": "பொது",
              "General Medicine": "பொது மருத்துவம்",
              "Cardiology": "கார்டியாலஜி",
              "Pediatrics": "குழந்தைகள் மருத்துவம்",
              "Neurology": "நரம்பியல்",
              "Dermatology": "தோல் மருத்துவம்",
              "Orthopedics": "எலும்பியல்",
              "Gynecology": "மகப்பேறு மருத்துவம்",
              "Dental": "பல் மருத்துவம்",
              "Dentistry": "பல் மருத்துவம்",
              "ENT": "காது மூக்கு தொண்டை",
              "Ophthalmology": "கண் மருத்துவம்",
              "Psychiatry": "மனநல மருத்துவம்",
              "General Surgery": "பொது அறுவை சிகிச்சை",
              "Urology": "சிறுநீரகவியல்",
              "Oncology": "புற்றுநோயியல்",
              "Radiology": "கதிரியக்கவியல்",
              "Others": "மற்றவை",
              "Psychotherapy": "உளவியல் சிகிச்சை"
            };
            const deptOptions = Array.from(depts).map((d, index) => {
              const englishPart = d.split('/')[0].trim();
              let tamilPart = d.split('/')[1] ? d.split('/')[1].trim() : '';
              if (!tamilPart) {
                const foundKey = Object.keys(departmentTranslations).find(k => k.toLowerCase() === englishPart.toLowerCase());
                tamilPart = foundKey ? departmentTranslations[foundKey] : '';
              }
              return {
                id: d,
                label: `${index + 1}. ${tamilPart ? `${englishPart} / ${tamilPart}` : englishPart}`,
                originalName: englishPart
              };
            });
            const announceText = "Please select the new Treatment Category:\n\nபுதிய சிகிச்சை வகையைத் தேர்ந்தெடுக்கவும்:\n\n" +
              deptOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
            addBotMessage(announceText);
            setCurrentOptions(deptOptions);
            addBotOptions(deptOptions);
            nextStep = 'ASK_CATEGORY';
          } else if (selectedOption.id === 'edit_doctor') {
            const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
            const schedulesForCat = schedulesForDate.filter(s => {
              if (!s.department) return currentData.categoryOriginalName === 'Others';
              return s.department.split(',').map(d => d.trim()).includes(currentData.categoryFullDept);
            });
            const activeDocs = allDoctors.filter(doc =>
              schedulesForCat.some(s => s.doctorId === doc._id || s.doctorId === doc.id || s.doctorName === doc.doctorName)
            );
            const docOptions = activeDocs.map((d, index) => ({
              id: d._id || d.id,
              name: d.doctorName,
              label: `${index + 1}. ${getBilingualDoctorName(d.doctorName)}\nexperience: ${d.experience || 'N/A'} Yrs Exp`
            }));
            const announceText = "Please select the new Doctor:\n\nபுதிய மருத்துவரைத் தேர்ந்தெடுக்கவும்:\n\n" +
              docOptions.map((opt, index) => {
                const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').replace('\n', ' ');
                return `Option ${index + 1}: ${cleanLabel}`;
              }).join('\n');
            addBotMessage(announceText);
            setCurrentOptions(docOptions);
            addBotOptions(docOptions);
            nextStep = 'ASK_DOCTOR';
          } else if (selectedOption.id === 'edit_time') {
            addBotMessage("Checking available slots... / நேரங்கள் சரிபார்க்கப்படுகின்றன...");
            try {
              const schedulesForDate = approvedSchedules.filter(s => s.date === currentData.selectedDateId);
              const schedulesForDoctor = schedulesForDate.filter(s =>
                s.doctorId === currentData.doctorId || s.doctorName === currentData.doctorName
              );
              const allTimings = schedulesForDoctor.flatMap(s => s.time || []);
              const uniqueTimings = [...new Set(allTimings)];
              const response = await axios.get(`${API_BASE_URL}/api/emails/booked-timings?appointment_date=${encodeURIComponent(currentData.selectedDateFormatted)}&_t=${Date.now()}`);
              const appointments = response.data || [];
              const bookedMap = {};
              appointments.forEach(app => {
                if (!['Pending', 'Approved', 'Rescheduled'].includes(app.status)) return;
                const docName = (app.doctor_name || '').trim();
                if (!bookedMap[docName]) bookedMap[docName] = [];
                bookedMap[docName].push((app.appointment_time || '').trim());
              });
              const targetDocName = (currentData.doctorName || '').trim();
              const bookedTimings = bookedMap[targetDocName] || [];
              let availableTimings = uniqueTimings.filter(t => {
                const tTrim = t.trim();
                if (bookedTimings.includes(tTrim)) return false;
                const startMins = parseTimeStringToMinutes(tTrim.split(/to|\-/)[0].trim());
                return !bookedTimings.some(booked => {
                  const bookedMins = parseTimeStringToMinutes(booked);
                  return bookedMins !== -1 && startMins !== -1 && bookedMins === startMins;
                });
              });
              const today = new Date();
              const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              if (currentData.selectedDateId === todayString) {
                const currentMinutes = today.getHours() * 60 + today.getMinutes();
                availableTimings = availableTimings.filter(t => {
                  const startStr = t.split('to')[0].split('-')[0].trim();
                  const startMins = parseTimeStringToMinutes(startStr);
                  return startMins > currentMinutes;
                });
              }

              const timeOpts = availableTimings.map((t, index) => ({
                id: t,
                label: `${index + 1}. ${t}`
              }));
              const announceText = "Please select the new Time slot:\n\nபுதிய நேரத்தைத் தேர்ந்தெடுக்கவும்:\n\n" +
                timeOpts.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
              addBotMessage(announceText);
              setCurrentOptions(timeOpts);
              addBotOptions(timeOpts);
              nextStep = 'ASK_TIME';
            } catch (err) {
              console.log(err);
              addBotMessage("Error checking slots. Please try selecting the doctor again.\n\nநேரங்களைச் சரிபார்ப்பதில் பிழை. தயவுசெய்து மருத்துவரை மீண்டும் தேர்ந்தெடுக்க முயற்சிக்கவும்.");
              nextStep = 'ASK_CONFIRMATION';
            }
          }
        }
        break;

      case 'EDITING_NAME':
        if (!input.trim()) {
          addBotMessage("Name cannot be empty. Please enter the Patient Name:\n\nபெயர் காலியாக இருக்க முடியாது. நோயாளியின் பெயரை உள்ளிடவும்:");
          nextStep = 'EDITING_NAME';
        } else {
          setPatientData(prev => ({ ...prev, name: input.trim() }));
          showUpdatedConfirmationSummary({ ...patientData, name: input.trim() });
          nextStep = 'ASK_CONFIRMATION';
        }
        break;

      case 'EDITING_AGE':
        if (!input.trim() || isNaN(input.trim())) {
          addBotMessage("Please enter a valid numeric Age:\n\nசரியான வயதை உள்ளிடவும்:");
          nextStep = 'EDITING_AGE';
        } else {
          setPatientData(prev => ({ ...prev, age: input.trim() }));
          showUpdatedConfirmationSummary({ ...patientData, age: input.trim() });
          nextStep = 'ASK_CONFIRMATION';
        }
        break;

      case 'EDITING_GENDER':
        let newGender = optionData ? optionData.id : null;
        if (!newGender) {
          const matched = matchOption(input, currentOptions);
          if (matched) newGender = matched.id;
        }
        if (!newGender) {
          const announceText = "Please select one of the gender options below.\n\nகீழே உள்ள பாலின விருப்பங்களில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'EDITING_GENDER';
        } else {
          setPatientData(prev => ({ ...prev, gender: newGender }));
          showUpdatedConfirmationSummary({ ...patientData, gender: newGender });
          nextStep = 'ASK_CONFIRMATION';
        }
        break;

      case 'EDITING_WHATSAPP':
        const newWhatsapp = input.toLowerCase() === 'skip' ? '' : input.trim();
        setPatientData(prev => ({ ...prev, whatsapp: newWhatsapp }));
        showUpdatedConfirmationSummary({ ...patientData, whatsapp: newWhatsapp });
        nextStep = 'ASK_CONFIRMATION';
        break;

      case 'EDITING_DATE':
        let selectedNewDate = optionData || matchOption(input, currentOptions);
        if (!selectedNewDate) {
          setMessages(prev => [...prev, {
            id: getUniqueId(),
            text: "Please select one of the scheduled dates below.\n\nகீழே உள்ள அட்டவணை தேதிகளில் ஒன்றை தேர்ந்தெடுக்கவும்.",
            isUser: false,
            type: 'calendar',
            availableDates: availableDates
          }]);
          speak("Please select one of the scheduled dates below.\n\nகீழே உள்ள அட்டவணை தேதிகளில் ஒன்றை தேர்ந்தெடுக்கவும்.");
          nextStep = 'EDITING_DATE';
        } else {
          const updated = {
            ...patientData,
            selectedDateId: selectedNewDate.id,
            selectedDateFormatted: selectedNewDate.formatted,
            categoryOriginalName: '',
            categoryFullDept: '',
            doctorId: '',
            doctorName: '',
            time: ''
          };
          setPatientData(updated);
          handleEditField('category', updated);
          return;
        }
        break;

      case 'EDITING_CATEGORY':
        let selectedNewCat = optionData || matchOption(input, currentOptions);
        if (!selectedNewCat) {
          const announceText = "Please select one of the categories below.\n\nகீழே உள்ள பிரிவுகளில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'EDITING_CATEGORY';
        } else {
          const updated = {
            ...patientData,
            categoryOriginalName: selectedNewCat.originalName,
            categoryFullDept: selectedNewCat.id,
            doctorId: '',
            doctorName: '',
            time: ''
          };
          setPatientData(updated);
          handleEditField('doctor', updated);
          return;
        }
        break;

      case 'EDITING_DOCTOR':
        let selectedNewDoc = optionData || matchOption(input, currentOptions);
        if (!selectedNewDoc) {
          const announceText = "Please select one of the doctors below.\n\nகீழே உள்ள மருத்துவர்களில் ஒருவரை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => {
              const cleanLabel = opt.label.replace(/^\d+\.\s*/, '').replace('\n', ' ');
              return `Option ${index + 1}: ${cleanLabel}`;
            }).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'EDITING_DOCTOR';
        } else {
          const updated = {
            ...patientData,
            doctorId: selectedNewDoc.id,
            doctorName: selectedNewDoc.name,
            time: ''
          };
          setPatientData(updated);
          handleEditField('time', updated);
          return;
        }
        break;

      case 'EDITING_TIME':
        let selectedNewTime = optionData;
        if (!selectedNewTime) {
          const optIndex = matchNumberFromSpokenText(input);
          if (optIndex >= 1 && optIndex <= currentOptions.length) {
            selectedNewTime = currentOptions[optIndex - 1];
          } else {
            selectedNewTime = matchTimeOption(input, currentOptions);
          }
        }
        if (!selectedNewTime) {
          const announceText = "Please select one of the time slots below.\n\nகீழே உள்ள நேரங்களில் ஒன்றை தேர்ந்தெடுக்கவும்.\n\n" +
            currentOptions.map((opt, index) => `Option ${index + 1}: ${opt.label.replace(/^\d+\.\s*/, '')}`).join('\n');
          addBotMessage(announceText);
          addBotOptions(currentOptions);
          nextStep = 'EDITING_TIME';
        } else {
          const updated = {
            ...patientData,
            time: selectedNewTime.id
          };
          setPatientData(updated);
          showUpdatedConfirmationSummary(updated);
          nextStep = 'ASK_CONFIRMATION';
        }
        break;

      case 'END':
        setPatientData({
          name: '',
          age: '',
          gender: '',
          whatsapp: '',
          selectedDateId: '',
          selectedDateFormatted: '',
          categoryOriginalName: '',
          categoryFullDept: '',
          doctorId: '',
          doctorName: '',
          time: ''
        });
        setHasCompletedInitialFlow(false);
        setCurrentOptions([]);
        setMessages([]);
        setCurrentStep('GREETING');
        isLoadedRef.current = false;

        setTimeout(() => {
          isLoadedRef.current = true;
          addBotMessage("Hi,\nI am Your DrZ AI Assistant. How Can I Help You Today?\n\nவணக்கம்.\nநான் உங்கள் DrZ AI உதவியாளர். உங்களுக்கு எப்படி உதவலாம்?");
          setTimeout(() => {
            const greetOptions = [{ id: 'start_booking', label: 'Book an appointment / சந்திப்பை முன்பதிவு செய்யவும்' }];
            setCurrentOptions(greetOptions);
            addBotOptions(greetOptions);
          }, 500);
        }, 500);
        return;
    }

    setCurrentStep(nextStep);
  };

  const startListening = async () => {
    if (!isVoiceAvailable) {
      Alert.alert("Voice Input Unavailable", "Speech recognizer is not configured or linked in this build.");
      return;
    }
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Microphone Permission',
              message: 'DrZ Chatbot needs access to your microphone so you can input information with your voice.',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Microphone permission is required to use speech-to-text.");
            return;
          }
        }
      }

      if (isListening) {
        try {
          await Voice.cancel();
        } catch (err) { }
        setIsListening(false);
      } else {
        setInputText('');
        try {
          await Voice.destroy();
        } catch (err) { }
        // Start in Tamil/Indian English to capture Tamil text
        await Voice.start('ta-IN');
      }
    } catch (e) {
      console.error("Voice start error:", e);
    }
  };

  const renderMessage = ({ item }) => {
    const lastInteractiveMsg = [...messages].reverse().find(m => m.type === 'options' || m.type === 'calendar');
    const isLatestOptions = lastInteractiveMsg ? item.id === lastInteractiveMsg.id : true;
    if (item.type === 'options') {
      const isTimeBlock = item.options.some(opt => /\d{1,2}[\.:]\d{2}/.test(String(opt.label)));
      const showHelperText = item.options.length > 1;

      return (
        <View style={[
          styles.optionsContainer,
          isTimeBlock && { flexDirection: 'row', flexWrap: 'wrap', width: '90%' }
        ]}>
          {item.options.map((opt, index) => {
            const hasNumberPrefix = /^\d+\.\s*/.test(opt.label);
            const idStr = String(opt.id);
            const labelStr = String(opt.label);
            const isGender = idStr === 'Male' || idStr === 'Female' || idStr === 'Others';
            const isTime = /\d{1,2}[\.:]\d{2}/.test(labelStr);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isGender && { alignSelf: 'flex-start' },
                  isTime && { alignSelf: 'auto', width: '48%', marginRight: '2%', paddingHorizontal: 8 }
                ]}
                onPress={() => handleOptionSelect(opt)}
              >
                {hasNumberPrefix && (
                  <View style={styles.optionNumberBadge}>
                    <Text style={styles.optionNumberText}>{index + 1}</Text>
                  </View>
                )}
                {opt.icon && <Icon name={opt.icon} size={18} color="#1C3E55" style={{ marginLeft: hasNumberPrefix ? 8 : 0 }} />}
                <Text
                  style={[
                    styles.optionContentText,
                    { marginLeft: hasNumberPrefix ? 10 : 0 },
                    isGender && { flex: 0 }
                  ]}
                >
                  {opt.label.replace(/^\d+\.\s*/, '')}
                </Text>
              </TouchableOpacity>
            );
          })}
          {showHelperText && (
            <Text style={[styles.helperText, { width: '100%', marginTop: 4 }]}>
              💡 You can also say the option number to make your selection / தேர்வு செய்ய, விருப்பத்தின் எண்ணையும் கூறலாம்.
            </Text>
          )}
        </View>
      );
    }

    if (item.type === 'calendar') {
      return (
        <View style={[
          styles.messageBubble,
          styles.botBubble,
          { width: '100%', flexDirection: 'column', alignItems: 'stretch' }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Icon name="robot-outline" size={20} color="#1C3E55" style={styles.botIcon} />
            <Text style={[styles.messageText, styles.botText]}>
              {item.text}
            </Text>
          </View>
          <CalendarView
            availableDates={item.availableDates}
            onSelect={(matchedOpt) => handleOptionSelect(matchedOpt)}
          />
        </View>
      );
    }

    if (item.type === 'confirmation_summary') {
      const data = item.patientData;
      const rows = [
        { key: 'name', label: 'Patient Name / பெயர்', value: data.name },
        { key: 'age', label: 'Age / வயது', value: data.age },
        { key: 'gender', label: 'Gender / பாலினம்', value: data.gender },
        { key: 'whatsapp', label: 'WhatsApp / வாட்ஸ்அப்', value: data.whatsapp || 'N/A' },
        { key: 'date', label: 'Date / தேதி', value: data.selectedDateFormatted },
        { key: 'category', label: 'Category / பிரிவு', value: data.categoryOriginalName },
        { key: 'doctor', label: 'Doctor / மருத்துவர்', value: data.doctorName },
        { key: 'time', label: 'Time / நேரம்', value: data.time }
      ];

      return (
        <View style={[
          styles.messageBubble,
          styles.botBubble,
          { width: '92%', alignSelf: 'flex-start', padding: 12, flexDirection: 'column', alignItems: 'stretch' }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Icon name="robot-outline" size={20} color="#1C3E55" style={styles.botIcon} />
            <Text style={[styles.messageText, styles.botText, { fontWeight: 'bold', fontSize: 15, color: '#1C3E55' }]}>
              📋 Confirm Details / விவரங்களை உறுதிப்படுத்தவும்
            </Text>
          </View>

          {rows.map((row) => (
            <View key={row.key} style={styles.summaryRow}>
              <TouchableOpacity
                onPress={() => handleEditField(row.key)}
                style={styles.summaryEditBtn}
              >
                <Text style={{ fontSize: 15 }}>✏️</Text>
              </TouchableOpacity>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>{row.label}</Text>
                <Text style={styles.summaryValue}>{row.value}</Text>
              </View>
            </View>
          ))}

          <Text style={{ fontSize: 11, color: '#7F8C8D', marginTop: 10, fontStyle: 'italic', textAlign: 'center', lineHeight: 16 }}>
            Tap ✏️ next to any detail to edit / மாற்ற விரும்பும் விவரத்தின் அருகிலுள்ள ✏️ ஐ அழுத்தவும்
          </Text>
        </View>
      );
    }

    const isEditableUserMsg = item.isUser && item.step && [
      'ASK_NAME', 'ASK_AGE', 'ASK_GENDER', 'ASK_WHATSAPP',
      'ASK_DATE', 'ASK_CATEGORY', 'ASK_DOCTOR', 'ASK_TIME',
      'EDITING_NAME', 'EDITING_AGE', 'EDITING_GENDER', 'EDITING_WHATSAPP',
      'EDITING_DATE', 'EDITING_CATEGORY', 'EDITING_DOCTOR', 'EDITING_TIME'
    ].includes(item.step);

    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: item.isUser ? 'flex-end' : 'flex-start',
        marginVertical: 4,
        width: '100%',
        justifyContent: item.isUser ? 'flex-end' : 'flex-start'
      }}>
        {isEditableUserMsg && (
          <TouchableOpacity
            onPress={() => {
              const stepToField = {
                'ASK_NAME': 'name',
                'ASK_AGE': 'age',
                'ASK_GENDER': 'gender',
                'ASK_WHATSAPP': 'whatsapp',
                'ASK_DATE': 'date',
                'ASK_CATEGORY': 'category',
                'ASK_DOCTOR': 'doctor',
                'ASK_TIME': 'time',
                'EDITING_NAME': 'name',
                'EDITING_AGE': 'age',
                'EDITING_GENDER': 'gender',
                'EDITING_WHATSAPP': 'whatsapp',
                'EDITING_DATE': 'date',
                'EDITING_CATEGORY': 'category',
                'EDITING_DOCTOR': 'doctor',
                'EDITING_TIME': 'time'
              };
              const field = stepToField[item.step];
              if (field) {
                handleEditField(field);
              }
            }}
            style={{
              padding: 6,
              marginRight: 8,
              backgroundColor: '#F0F4F8',
              borderRadius: 15,
              width: 30,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Text style={{ fontSize: 14 }}>✏️</Text>
          </TouchableOpacity>
        )}

        <View style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
          item.isCategory && { width: 300 },
          { marginBottom: 0, alignSelf: 'auto', maxWidth: isEditableUserMsg ? '80%' : '90%' }
        ]}>
          {!item.isUser && <Icon name="robot-outline" size={20} color="#1C3E55" style={styles.botIcon} />}
          {item.isUser ? (
            <View style={{ flexShrink: 1, marginRight: 8, paddingRight: 6 }}>
              <Text style={[styles.messageText, { color: '#fff', flexShrink: 1 }]}>
                {item.text.includes(' / ') ? (
                  <>
                    <Text>{item.text.split(' / ')[0]} / </Text>
                    <Text>{item.text.split(' / ')[1]}    </Text>
                  </>
                ) : (
                  <Text>{item.text}    </Text>
                )}
              </Text>
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              styles.botText,
              item.isCategory && { flex: 1 },
              { flexShrink: 1, flexWrap: 'wrap' }
            ]}>
              {item.text}
            </Text>
          )}
          {item.isUser && <Icon name="account-circle-outline" size={20} color="#fff" style={styles.userIcon} />}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5, marginRight: 10 }}>
            <Icon name="arrow-left" size={24} color="#1C3E55" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Chat Bot / AI உதவியாளர்</Text>
            <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{formatDateTime(currentDateTime)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleResetChatbot} style={{ padding: 5, marginRight: 10 }}>
            <Icon name="refresh" size={24} color="#1C3E55" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')} style={{ padding: 5 }}>
            <Icon name="exit-to-app" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#1C3E55" />
          <Text style={{ marginLeft: 8, color: '#888' }}>AI is typing...</Text>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.micButton} onPress={startListening}>
            <Icon name={isListening ? "microphone" : "microphone-outline"} size={24} color={isListening ? "#E74C3C" : "#888"} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={isListening ? "Listening..." : "Type a message..."}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />

          <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
            <Icon name="send" size={24} color="#1C3E55" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EAEAEA',
  },
  summaryEditBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#F0F4F8',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  chatList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  botBubble: {
    backgroundColor: '#F0F8FF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    maxWidth: '90%',
  },
  userBubble: {
    backgroundColor: '#1C3E55',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    maxWidth: '90%',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: '#333',
    flex: 1,
    paddingRight: 6,
  },
  userText: {
    color: '#fff',
    marginRight: 8,
    paddingRight: 6,
  },
  botIcon: {
    marginRight: 8,
    alignSelf: 'flex-start',
    marginTop: 2
  },
  userIcon: {
    alignSelf: 'flex-start',
    marginTop: 2
  },
  optionsContainer: {
    alignSelf: 'flex-start',
    marginLeft: 30,
    marginBottom: 12,
    width: '90%',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1C3E55',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  optionText: {
    color: '#1C3E55',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  optionNumberBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1C3E55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  optionContentText: {
    color: '#1C3E55',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 5,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  micButton: {
    padding: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    color: '#333'
  },
  sendButton: {
    padding: 10,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 4,
  },
  calendarHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    fontSize: 12,
    color: '#888',
    width: '14%',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCellOutside: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    width: '100%',
  },
  dayTextOutside: {
    color: '#ccc',
  },
  dayTextAvailable: {
    color: '#000',
    fontWeight: 'bold',
  },
  dayTextDisabled: {
    color: '#718096',
  },
  dayTextToday: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

export default ChatbotScreen;



























