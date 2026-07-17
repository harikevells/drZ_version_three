import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Image, TouchableOpacity, ImageBackground, Modal, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
import { NavigationContainer, useNavigation, useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

// IMPORT SCREENS
import LoginScreen from '../screens/LoginScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import BookAppointmentScreen from '../screens/BookAppointmentScreen';
import ChatBotBookingScreen from '../screens/ChatBotBookingScreen';
import VoiceBookingScreen from '../screens/VoiceBookingScreen';
import NotificationPatient from '../screens/NotificationPatient';
import AppointmentsListScreen from '../screens/AppointmentsListScreen';
// import ReportScreen from '../screens/ReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dummy Component for Ambulance Tab
const AmbulanceComponent = () => <View />;

// ✅ NEW: Payment Screen Component (Fixed to prevent crash)
const PaymentScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (isFocused && user) {
      const fetchUnreadCount = async () => {
        try {
          const IP_ADDRESS = '10.10.11.90';
          const BASE_URL = `http://${IP_ADDRESS}:5000`;
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

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  return (
    <SafeAreaView style={styles.paymentContainer} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={[styles.userInfo, { backgroundColor: '#F0F0F0', padding: 5, paddingRight: 15, borderRadius: 25 }]}>
          <Image source={require('../assets/logo.png')} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#FFF' }} resizeMode="contain" />
          <View style={styles.textContainer}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111' }}>Welcome To DrZ</Text>
          </View>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 0 }]} onPress={() => navigation.navigate('NotificationPatient')}>
            <Icon name="bell-outline" size={24} color="#6276F5" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: '#F0F0F0', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', elevation: 0, marginLeft: 5 }]} onPress={handleLogoutPress}>
            <Icon name="logout" size={24} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 }}>
        <Text style={styles.paymentTitle}>Scan here to pay</Text>
        <Text style={styles.paymentSubtitle}>இங்கே ஸ்கேன் செய்து பணம் செலுத்தவும்</Text>

        <View style={styles.qrContainer}>
          {/* NOTE: To use your real image:
           1. Put 'payment.png' inside 'src/assets/' folder.
           2. Uncomment the <Image> block below.
           3. Remove the <Icon> line.
        */}

          <Image
            source={require('../assets/payment.jpeg')}
            style={styles.qrImage}
            resizeMode="contain"
          />


          {/* Placeholder Icon so app doesn't crash */}
          {/* <Icon name="qrcode-scan" size={200} color="#000" /> */}

        </View>
      </View>

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
            <Text style={styles.modalTitle}>Logout / வெளியேறு</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout? / நீங்கள் வெளியேற விரும்புகிறீர்களா?</Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelText}>Cancel / ரத்து</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.logoutBtn]} onPress={confirmLogout}>
                <Text style={styles.logoutText}>Confirm / உறுதி</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



// --- ACTIVE TAB INDICATOR ---
const ActiveTabIndicator = () => (
  <View style={{
    position: 'absolute',
    bottom: '100%',
    marginBottom: 2, // 2px safe gap above the icon
    width: 65,
    left: 0, // Aligns to the left edge of the icon (top-left)
    transform: [{ translateX: -32.5 }], // Centers the entire 65px container exactly over the left edge
    alignItems: 'center',
  }}>
    {/* 1. The Flattened V-Notch */}
    <View style={{
      width: 55,
      height: 55,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      transform: [
        { scaleY: 0.45 },
        { rotate: '45deg' }
      ],
    }} />

    {/* 2. The Blue Ball */}
    <View style={{
      position: 'absolute',
      bottom: 20,
      left: '50%', // Keeps the ball perfectly centered directly over the V-notch
      transform: [{ translateX: -5 }], // Centers the 10px ball inside the container
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#5465FF',
    }} />
  </View>
);

// --- DASHBOARD TABS ---
function DashboardTabs() {
  const { texts } = useContext(LanguageContext);

  const openAmbulance = () => {
    const phoneNumber = '801';
    Linking.openURL(`tel:${phoneNumber}`).catch(err =>
      Alert.alert('Error', 'Unable to open dialer')
    );
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 70,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: '#5465FF',
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 20,
          borderRadius: 18,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }
      }}
    >
      {/* 1. HOME TAB */}
      <Tab.Screen
        name="AppointmentTab"
        component={AppointmentScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <View style={{ paddingBottom: 10, marginTop: focused ? 5 : 0 }}>
              <Text style={{ fontSize: 10, color: focused ? '#FFF' : 'rgba(255,255,255,0.7)', fontWeight: focused ? 'bold' : 'normal', textAlign: 'center' }}>
                {texts?.home || 'Home'} /{'\n'}ஹோம்
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: focused ? 5 : 0 }}>
              {focused && <ActiveTabIndicator />}
              <Icon name={focused ? "home" : "home-outline"} color={focused ? '#FFF' : 'rgba(255,255,255,0.7)'} size={24} />
            </View>
          ),
        }}
      />

      {/* 2. APPOINTMENTS LIST TAB */}
      <Tab.Screen
        name="AppointmentsListTab"
        component={AppointmentsListScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <View style={{ paddingBottom: 10, marginTop: focused ? 5 : 0 }}>
              <Text style={{ fontSize: 10, color: focused ? '#FFF' : 'rgba(255,255,255,0.7)', fontWeight: focused ? 'bold' : 'normal', textAlign: 'center' }}>
                Bookings /{'\n'}பதிவுகள்
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: focused ? 5 : 0 }}>
              {focused && <ActiveTabIndicator />}
              <Icon name={focused ? "calendar-month" : "calendar-month-outline"} color={focused ? '#FFF' : 'rgba(255,255,255,0.7)'} size={24} />
            </View>
          ),
        }}
      />

      {/* 3. PAYMENT TAB */}
      <Tab.Screen
        name="PaymentTab"
        component={PaymentScreen}
        options={{
          tabBarLabel: ({ focused }) => (
            <View style={{ paddingBottom: 10, marginTop: focused ? 5 : 0 }}>
              <Text style={{ fontSize: 10, color: focused ? '#FFF' : 'rgba(255,255,255,0.7)', fontWeight: focused ? 'bold' : 'normal', textAlign: 'center' }}>
                Payment /{'\n'}பேமெண்ட்
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: focused ? 5 : 0 }}>
              {focused && <ActiveTabIndicator />}
              <Icon name={focused ? "credit-card" : "credit-card-outline"} color={focused ? '#FFF' : 'rgba(255,255,255,0.7)'} size={24} />
            </View>
          ),
        }}
      />

      {/* 4. AMBULANCE TAB (Opens Dialer) */}
      <Tab.Screen
        name="Ambulance"
        component={AmbulanceComponent}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            openAmbulance();
          },
        }}
        options={{
          tabBarLabel: ({ focused }) => (
            <View style={{ paddingBottom: 10, marginTop: focused ? 5 : 0 }}>
              <Text style={{ fontSize: 10, color: focused ? '#FFF' : 'rgba(255,255,255,0.7)', fontWeight: focused ? 'bold' : 'normal', textAlign: 'center' }}>
                {texts?.ambulance || 'Ambulance'} /{'\n'}ஆம்புலன்ஸ்
              </Text>
            </View>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: focused ? 5 : 0 }}>
              {focused && <ActiveTabIndicator />}
              <Icon name="ambulance" color={focused ? '#FFF' : 'rgba(255,255,255,0.7)'} size={24} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/Android Compact - 98.png')}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
        resizeMode="cover"
      >
        <Image
          source={require('../assets/logo.png')}
          style={{ width: 320, height: 160 }}
          resizeMode="contain"
        />
      </ImageBackground>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardTabs} />
            <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
            <Stack.Screen name="ChatBotBooking" component={ChatBotBookingScreen} />
            <Stack.Screen name="VoiceBooking" component={VoiceBookingScreen} />
            <Stack.Screen name="NotificationPatient" component={NotificationPatient} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  // Payment Screen Styles
  paymentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.005,
    marginBottom: 10
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  textContainer: { justifyContent: 'center' },
  headerIcons: { flexDirection: 'row' },
  iconButton: { backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 2, position: 'relative' },
  badge: { position: 'absolute', right: 2, top: 2, backgroundColor: '#E74C3C', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  paymentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3E55',
    marginBottom: 5,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  qrContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 10,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  // Logout Modal
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  logoutModalContent: { width: '88%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  modalButtonRow: { flexDirection: 'row', width: '100%', gap: 10 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc' },
  logoutBtn: { backgroundColor: '#E74C3C' },
  cancelText: { color: '#333', fontWeight: 'bold' },
  logoutText: { color: '#fff', fontWeight: 'bold' },
});

export default AppNavigator;