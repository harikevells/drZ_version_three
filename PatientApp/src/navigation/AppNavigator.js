import React, { useContext } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Image } from 'react-native'; 
import { NavigationContainer } from '@react-navigation/native';
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
// import ReportScreen from '../screens/ReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Dummy Component for Ambulance Tab
const AmbulanceComponent = () => <View />;

// ✅ NEW: Payment Screen Component (Fixed to prevent crash)
const PaymentScreen = () => {
  return (
    <View style={styles.paymentContainer}>
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
  );
};

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
          tabBarActiveTintColor: '#1C3E55',
          tabBarInactiveTintColor: '#888',
          tabBarShowLabel: true,
          tabBarStyle: { 
              height: 80, 
              paddingBottom: 10, 
              paddingTop: 10,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#eee',
              elevation: 15,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
          }
        }}
      >
        {/* 1. HOME TAB */}
        <Tab.Screen 
          name="AppointmentTab" 
          component={AppointmentScreen} 
          options={{
            tabBarLabel: ({ focused, color }) => (
                <View style={{alignItems:'center', marginTop: 0}}>
                    <Text style={{fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal'}}>
                        {texts?.home || 'Home'}/
                    </Text>
                    <Text style={{fontSize: 16, color: color, marginTop: -2}}>
                        ஹோம்
                    </Text>
                </View>
            ),
            tabBarIcon: ({ color, focused }) => (
                <Icon name={focused ? "home" : "home-outline"} color={color} size={30} />
            ),
          }}
        />

        {/* 2. PAYMENT TAB */}
        <Tab.Screen 
          name="PaymentTab" 
          component={PaymentScreen} 
          options={{
            tabBarLabel: ({ focused, color }) => (
                <View style={{alignItems:'center', marginTop: 0}}>
                    <Text style={{fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal'}}>
                        Payment/
                    </Text>
                    <Text style={{fontSize: 10, color: color, marginTop: -2}}>
                        பேமெண்ட்
                    </Text>
                </View>
            ),
            tabBarIcon: ({ color, focused }) => (
                <Icon name="qrcode-scan" color={color} size={28} />
            ),
          }}
        />

        {/* 3. AMBULANCE TAB (Opens Dialer) */}
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
            tabBarLabel: ({ focused, color }) => (
                <View style={{alignItems:'center', marginTop: 0}}>
                    <Text style={{fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal'}}>
                        {texts?.ambulance || 'Ambulance'}/
                    </Text>
                    <Text style={{fontSize: 10, color: color, marginTop: -2}}>
                        ஆம்புலன்ஸ்
                    </Text>
                </View>
            ),
            tabBarIcon: ({ color }) => (
                <Icon name="ambulance" color={color} size={30} />
            ),
          }}
        />
      </Tab.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
const AppNavigator = () => {
  const { user } = useContext(AuthContext);

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
  }
});

export default AppNavigator;