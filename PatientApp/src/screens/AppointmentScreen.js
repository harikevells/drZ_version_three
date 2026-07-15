import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  Modal,
  Dimensions,
  PixelRatio
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

const AppointmentScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const { language, changeLanguage, texts } = useContext(LanguageContext);

  const [showLangModal, setShowLangModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();

  // Fetch unread notifications count
  useEffect(() => {
    if (isFocused && user) {
      const fetchUnreadCount = async () => {
        try {
          // IP_ADDRESS should match the global one if possible, assuming BASE_URL is same as other screens
          const IP_ADDRESS = '10.10.11.90'; // Usually imported or handled via apiClient, but hardcoding since no global BASE_URL here. Wait, let's construct BASE_URL.
          const BASE_URL = `http://${IP_ADDRESS}:5000`; // Will define above or just here
          const mobile = user.contactNumber || user.mobile;
          const response = await axios.get(`${BASE_URL}/api/notifications/patient/${mobile}`);
          const unread = response.data.filter(n => !n.isRead).length;
          setUnreadCount(unread);
        } catch (error) {
          console.log("Error fetching notifications count", error);
        }
      };
      fetchUnreadCount();
    }
  }, [isFocused, user]);

  // --- Handlers ---
  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const handleContactUs = () => {
    const phoneNumber = '097891 91180';
    let url = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  // ✅ Handler for Logo Click
  const handleLogoClick = () => {
    const phoneNumber = '9876543210';
    let url = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  const handleLocation = () => {
    const label = 'Kavell Corp, Madurai';
    const lat = 9.9252;
    const lng = 78.1198;
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });
    const webUrl = `https://maps.app.goo.gl/jYQiodtm64Tausv56`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) return Linking.openURL(url);
      return Linking.openURL(webUrl);
    }).catch(err => console.error('An error occurred', err));
  };

  const handleWebsite = () => {
    const url = 'https://www.kevellcorp.com/';
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>

      {/* --- Main Content Scroll --- */}
      <ScrollView contentContainerStyle={styles.container}>

        {/* --- HEADER (User Icon + Greeting) --- */}
        <View style={styles.header}>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Image source={require('../assets/logo.png')} style={styles.userImage} resizeMode="contain" />
            <View style={styles.textContainer}>
              <Text style={styles.greeting}>Hi / வணக்கம் ,</Text>

            </View>
          </View>

          {/* Header Icons */}
          <View style={styles.headerIcons}>
            {/* Notification Icon */}
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('NotificationPatient')}>
              <Icon name="bell-outline" size={24} color="#1C3E55" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout Icon */}
            <TouchableOpacity style={[styles.iconButton, { marginLeft: 10 }]} onPress={handleLogoutPress}>
              <Icon name="logout" size={24} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MAIN CARD SECTION (Redesigned) --- */}
        <View style={styles.cardWrapper}>
          <View style={styles.card}>

            {/* ✅ Victor Hospital Logo Section */}
            <TouchableOpacity onPress={handleLogoClick} style={styles.logoContainer}>
              {/* <Image source={require('../assets/motherteressa.png')} style={styles.topImage} resizeMode="contain" /> */}
              {/* <Text style={styles.hospitalName}>VICTOR</Text> */}
              {/* <Text style={styles.hospitalSubName}>Hospital</Text> */}

              <View style={styles.poweredByContainer}>
                {/* <Text style={styles.poweredByText}>Powered by</Text> */}
                <Image source={require('../assets/logo.png')} style={styles.drzLogo} resizeMode="contain" />
              </View>
            </TouchableOpacity>

            {/* Description Text */}
            <Text style={styles.description}>
              {/* {texts?.description || "Choose from our list of qualified and verified doctors across various specialties.\nபல்வேறு சிறப்பு துறைகளில் தகுதி பெற்ற மற்றும் சரிபார்க்கப்பட்ட மருத்துவர்களின் பட்டியலில் இருந்து தேர்வு செய்யவும்."} */}
            </Text>

            {/* Illustration (Optional - you can remove if you want exactly like image 2) */}
            {/* <Image source={require('../assets/motherteressa.png')} style={styles.illustration} resizeMode="contain" /> */}

            {/* Buttons Stack */}
            <View style={styles.buttonStack}>

              {/* 1. Book Appointment */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('BookAppointment')}
              >
                <Text style={styles.primaryButtonText}>
                  Book Appointment/முன்பதிவு செய்யவும்
                </Text>
              </TouchableOpacity>

              {/* 2. Get Location */}
              <TouchableOpacity style={styles.secondaryButton} onPress={handleLocation}>
                <Text style={styles.secondaryButtonText}>
                  Get Our Location/எங்கள் இருப்பிடத்தை பெறவும்
                </Text>
              </TouchableOpacity>

              {/* 3. Contact */}
              <TouchableOpacity style={styles.successButton} onPress={handleContactUs}>
                <Text style={styles.successButtonText}>
                  Tap To Contact/எங்களை தொடர்பு கொள்ளவும்
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- FOOTER WITH CHAT ICON --- */}
          <View style={styles.footerWrapper}>
            <View style={styles.footerWebsiteContainer}>
              <Text style={styles.footerWebsiteTitle}>எங்கள் வலைதளத்தைப் பார்வையிடவும்</Text>
              <TouchableOpacity onPress={handleWebsite} style={styles.websiteRow}>
                <Text style={[styles.footerWebsiteTitle, { marginBottom: 0 }]}>Website : </Text>
                <Text style={styles.footerWebsiteLink} numberOfLines={1} adjustsFontSizeToFit>kevellcorp.com</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.inlineFab} 
              onPress={() => navigation.navigate('ChatBotBooking')}
            >
              <Icon name="robot-outline" size={24} color="#FFF" style={{ marginBottom: 2 }} />
              <Text style={styles.fabText}>AI Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* --- LANGUAGE MODAL --- */}
      <Modal
        visible={showLangModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLangModal(false)}
        >
          <View style={styles.langModalContent}>
            <TouchableOpacity
              style={styles.langOption}
              onPress={() => { changeLanguage('en'); setShowLangModal(false); }}
            >
              <View style={[styles.radioOuter, language === 'en' && styles.radioActiveBorder]}>
                {language === 'en' && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CUSTOM LOGOUT MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.logoutModalContent}>
            <Icon name="logout" size={40} color="#E74C3C" style={{ marginBottom: 10 }} />

            <Text style={styles.modalTitle}>{texts?.logout || 'Logout / வெளியேறு'}</Text>
            <Text style={styles.modalMessage}>
              {texts?.areYouSure || 'Are you sure you want to logout? / நீங்கள் வெளியேற விரும்புகிறீர்களா?'}
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>{texts?.cancel || 'Cancel / ரத்து'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.logoutBtn]}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutText}>{texts?.logout || 'Confirm / உறுதி'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const scaleFont = (size) => {
  const newSize = size * (width / 375);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 0, paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.005,
    marginBottom: 0
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userImage: { width: width * 0.15, height: width * 0.08, marginRight: 12 },
  textContainer: { justifyContent: 'center' },
  greeting: { fontSize: scaleFont(20), fontWeight: 'bold', color: '#1C3E55' },
  subGreeting: { fontSize: scaleFont(14), color: 'gray' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 2, position: 'relative' },
  badge: { position: 'absolute', right: 2, top: 2, backgroundColor: '#E74C3C', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Card Wrapper
  cardWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: height * 0.02, paddingHorizontal: width * 0.05 },
  card: {
    backgroundColor: '#F9F9F9', // Slightly lighter background
    borderRadius: 10,
    paddingVertical: height * 0.025,
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },

  // ✅ New Logo Section Styles (Matches Image 2)
  logoContainer: { alignItems: 'center', marginBottom: height * 0.005 },
  topImage: { width: width * 0.3, height: height * 0.07, borderRadius: 40, marginBottom: height * 0.005 },
  hospitalName: { fontSize: scaleFont(32), fontWeight: '900', color: '#032541', letterSpacing: 1, textAlign: 'center', marginBottom: 0 },
  hospitalSubName: { fontSize: scaleFont(20), fontWeight: 'bold', color: '#032541', marginTop: -4, textAlign: 'center', marginBottom: height * 0.005 },
  poweredByContainer: { alignItems: 'center', marginTop: height * 0.005, marginBottom: height * 0.01 },
  poweredByText: { fontSize: scaleFont(12), color: '#555', fontWeight: 'bold', marginBottom: 2 },
  drzLogo: { width: width * 0.55, height: height * 0.24 },

  // Description
  description: { fontSize: scaleFont(14), color: '#444', textAlign: 'center', marginBottom: height * 0.01, lineHeight: 22, paddingHorizontal: 1 },

  // Buttons Stack
  buttonStack: { width: '100%', gap: height * 0.02 },

  // Buttons
  primaryButton: { backgroundColor: '#1C3E55', width: '100%', paddingVertical: height * 0.015, borderRadius: 10, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: scaleFont(16), fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 5 },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#1C3E55', width: '100%', paddingVertical: height * 0.015, borderRadius: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#1C3E55', fontSize: scaleFont(16), fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 5 },
  successButton: { backgroundColor: '#38A745', width: '100%', paddingVertical: height * 0.015, borderRadius: 10, alignItems: 'center' },
  successButtonText: { color: '#fff', fontSize: scaleFont(16), fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 5 },

  // Footer Website Styles
  footerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: width * 0.05,
    marginTop: height * 0.05,
    marginBottom: height * 0.02,
  },
  footerWebsiteContainer: { alignItems: 'flex-start', flex: 1 },
  footerWebsiteTitle: { fontSize: scaleFont(14), color: '#333', fontWeight: 'bold', marginBottom: 5 },
  footerWebsiteLink: { fontSize: scaleFont(14), color: '#0d71b3ff', textDecorationLine: 'underline', flexShrink: 1 },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  // Language Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 70, paddingRight: 20 },
  langModalContent: { width: 180, backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 10 },
  langOption: { flexDirection: 'row', alignItems: 'center' },
  langText: { fontSize: 16, color: '#333', marginLeft: 10, fontWeight: '500' },
  langTextActive: { fontWeight: 'bold', color: '#000' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioActiveBorder: { borderColor: '#28a745' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#28a745' },

  // Logout Modal
  centerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutModalContent: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 10
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButtonRow: { flexDirection: 'row', width: '100%', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
  logoutBtn: { backgroundColor: '#E74C3C' },
  cancelText: { color: '#333', fontWeight: 'bold' },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  
  // Inline FAB Style
  inlineFab: {
    backgroundColor: '#1C3E55',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginLeft: 10,
  },
  fabText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default AppointmentScreen;