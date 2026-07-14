import React, { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useIsFocused } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
  Modal,
  Dimensions,
  PixelRatio,
  Animated
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
          const BASE_URL = API_BASE_URL;
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
    const url = 'https://kevellcorporation.com/#/';
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* --- Main Content Scroll --- */}
      <ScrollView contentContainerStyle={styles.container}>

        {/* --- HEADER (User Icon + Greeting) --- */}
        <View style={styles.header}>

          {/* User Info */}
          <View style={styles.welcomePill}>
            <Image source={require('../assets/logo.png')} style={styles.userImageSmall} resizeMode="contain" />
            <Text style={styles.greetingText}>Welcome To DrZ</Text>
          </View>

          {/* Header Icons */}
          <View style={styles.headerIcons}>
            {/* Notification Icon */}
            <TouchableOpacity style={styles.notificationBtn} onPress={() => navigation.navigate('NotificationPatient')}>
              <Icon name="bell-outline" size={24} color="#5F76FE" />
              {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout Icon */}
            <TouchableOpacity style={[styles.notificationBtn, { marginLeft: 10 }]} onPress={handleLogoutPress}>
              <Icon name="logout" size={24} color="#5F76FE" />
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MAIN CARD SECTION (Redesigned) --- */}
        <View style={styles.cardWrapper}>
          <ImageBackground
            source={require('../assets/boxAppointmentBg.png')}
            style={styles.card}
            imageStyle={{ borderRadius: 10 }}
            resizeMode="cover"
          >

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
          </ImageBackground>

          {/* --- FOOTER WEBSITE LINK (Outside Card) --- */}
          <View style={styles.footerWebsiteContainer}>
            <Text style={styles.footerWebsiteTitle}>எங்கள் வலைதளத்தைப் பார்வையிடவும்</Text>

            {/* Add the row style here */}
            <TouchableOpacity onPress={handleWebsite} style={styles.websiteRow}>
              <Text style={[styles.footerWebsiteTitle, { marginBottom: 0 }]}>Website : </Text>
              <Text style={styles.footerWebsiteLink}>https://kevellcorporation.com</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* --- CHATBOT FLOATING ACTION BUTTON --- */}
      <TouchableOpacity
        style={styles.chatbotFabWrapper}
        onPress={() => navigation.navigate('Chatbot')}
      >
        <View style={styles.chatbotBubble}>
          <Text style={styles.chatbotBubbleText}>Can I Assist?</Text>
          <View style={styles.bubbleArrow} />
        </View>
        <View style={styles.chatbotIconBorder}>
          <Image source={require('../assets/Aibotimage.png')} style={{ width: 54, height: 28, borderRadius: 22 }} resizeMode="contain" />
        </View>
      </TouchableOpacity>

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
            <Icon name="logout-variant" size={45} color="#5F76FE" style={{ marginBottom: 20 }} />

            <Text style={styles.modalMessage}>
              Are you sure you want to logout?{'\n'}நீங்கள் வெளியேற விரும்புகிறீர்களா?
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelBtn]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>Cancel / ரத்து</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.logoutBtn]}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutText}>Confirm / உறுதி</Text>
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
  container: { paddingHorizontal: 0, paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.015,
    marginBottom: 10
  },
  welcomePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5E5', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 25 },
  userImageSmall: { width: 30, height: 30, marginRight: 10 },
  greetingText: { fontSize: scaleFont(12), fontWeight: 'bold', color: '#000' },
  headerIcons: { flexDirection: 'row' },
  notificationBtn: {
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

  // Card Wrapper
  cardWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: height * 0.01, paddingHorizontal: width * 0.05 },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: height * 0.025,
    paddingHorizontal: width * 0.005,
    alignItems: 'center',
    width: '100%',
  },

  // ✅ New Logo Section Styles (Matches Image 2)
  logoContainer: { alignItems: 'center', marginBottom: height * 0.005 },
  topImage: { width: width * 0.3, height: height * 0.07, borderRadius: 40, marginBottom: height * 0.005 },
  hospitalName: { fontSize: scaleFont(32), fontWeight: '900', color: '#032541', letterSpacing: 1, textAlign: 'center', marginBottom: 0 },
  hospitalSubName: { fontSize: scaleFont(20), fontWeight: 'bold', color: '#032541', marginTop: -4, textAlign: 'center', marginBottom: height * 0.005 },
  poweredByContainer: { alignItems: 'center', marginTop: height * 0.005, marginBottom: height * 0.01 },
  poweredByText: { fontSize: scaleFont(12), color: '#555', fontWeight: 'bold', marginBottom: 2 },
  drzLogo: { width: width * 0.65, height: height * 0.18 },

  // Description
  description: { fontSize: scaleFont(14), color: '#444', textAlign: 'center', marginBottom: height * 0.01, lineHeight: 22, paddingHorizontal: 1 },

  // Buttons Stack
  buttonStack: { width: '100%', gap: height * 0.02, paddingHorizontal: 15 },

  // Buttons
  primaryButton: { backgroundColor: '#5C74FF', width: '100%', paddingVertical: height * 0.018, borderRadius: 8, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: scaleFont(14), fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 5 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#444', width: '100%', paddingVertical: height * 0.018, borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#444', fontSize: scaleFont(14), fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 5 },
  successButton: { backgroundColor: '#32CD32', width: '100%', paddingVertical: height * 0.018, borderRadius: 8, alignItems: 'center' },
  successButtonText: { color: '#fff', fontSize: scaleFont(14), fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 5 },

  // Footer Website Styles
  footerWebsiteContainer: { marginTop: height * 0.06, alignItems: 'center' },
  footerWebsiteTitle: { fontSize: scaleFont(16), color: '#333', fontWeight: 'bold', marginBottom: 5 },
  footerWebsiteLink: { fontSize: scaleFont(16), color: '#0d71b3ff', textDecorationLine: 'underline', width: 250 },
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
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 10
  },
  modalMessage: { fontSize: 16, color: '#444', textAlign: 'center', marginBottom: 30, fontWeight: 'bold', lineHeight: 26, width: '100%' },
  modalButtonRow: { flexDirection: 'row', width: '100%', gap: 12 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#ccc' },
  logoutBtn: { backgroundColor: '#FF4B4B' },
  cancelText: { color: '#333', fontWeight: 'bold', fontSize: 14 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  // Chatbot FAB Styles
  chatbotFabWrapper: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
  },
  chatbotBubble: {
    backgroundColor: '#2999FC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotBubbleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bubbleArrow: {
    position: 'absolute',
    right: -6,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderBottomWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: '#2999FC',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  chatbotIconBorder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    borderColor: '#2999FC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});

export default AppointmentScreen;