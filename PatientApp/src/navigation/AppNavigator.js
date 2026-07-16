import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import NotificationPatient from '../screens/NotificationPatient';
import ChatbotScreen from '../screens/ChatbotScreen';
import PatientAppointmentsScreen from '../screens/PatientAppointmentsScreen';
import PrescriptionListScreen from '../screens/PrescriptionListScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();



// --- DASHBOARD TABS ---
function DashboardTabs() {
  const { texts } = useContext(LanguageContext);

  // Custom Tab Bar Component
  const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={1}
            >
              {isFocused && (
                <View style={styles.activeNotchContainer}>
                  <View style={styles.cutoutWrapper}>
                    <View style={styles.cutout} />
                  </View>
                  <View style={styles.dot} />
                </View>
              )}

              <View style={[styles.iconContainer, isFocused && { marginTop: 8 }]}>
                {options.tabBarIcon && options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  size: 24
                })}
                {options.tabBarLabel && options.tabBarLabel({
                  focused: isFocused,
                  color: isFocused ? '#fff' : 'rgba(255, 255, 255, 0.7)'
                })}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 1. HOME TAB */}
      <Tab.Screen
        name="AppointmentTab"
        component={AppointmentScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={{ alignItems: 'center', marginTop: 0 }}>
              <Text style={{ fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal' }}>
                {texts?.home || 'Home'}/
              </Text>
              <Text style={{ fontSize: 12, color: color, marginTop: -2 }}>
                ஹோம்
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'home' : 'home-outline'} color={color} size={28} />
          ),
        }}
      />

      {/* 2. APPOINTMENTS TAB */}
      <Tab.Screen
        name="PatientAppointments"
        component={PatientAppointmentsScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={{ alignItems: 'center', marginTop: 0 }}>
              <Text style={{ fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal' }}>
                Appointments/
              </Text>
              <Text style={{ fontSize: 10, color: color, marginTop: -2 }}>
                முன்பதிவுகள்
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'calendar-check' : 'calendar-clock'} color={color} size={28} />
          ),
        }}
      />

      {/* 3. PRESCRIPTION TAB */}
      <Tab.Screen
        name="PrescriptionTab"
        component={PrescriptionListScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={{ alignItems: 'center', marginTop: 0 }}>
              <Text style={{ fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal' }}>
                Prescription/
              </Text>
              <Text style={{ fontSize: 10, color: color, marginTop: -2 }} numberOfLines={1} adjustsFontSizeToFit>
                மருந்துச் சீட்டு
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Icon name="file-document-edit-outline" color={color} size={26} />
          ),
        }}
      />

      {/* 4. PROFILE TAB */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <View style={{ alignItems: 'center', marginTop: 0 }}>
              <Text style={{ fontSize: 12, color: color, fontWeight: focused ? 'bold' : 'normal' }}>
                Profile/
              </Text>
              <Text style={{ fontSize: 10, color: color, marginTop: -2 }} numberOfLines={1} adjustsFontSizeToFit>
                சுயவிவரம்
              </Text>
            </View>
          ),
          tabBarIcon: ({ color, focused }) => (
            <Icon name="account-outline" color={color} size={28} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- MAIN NAVIGATOR ---
const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

const AppNavigator = () => {
  const { user, isLoading: authLoading } = useContext(AuthContext);
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
        const state = savedStateString ? JSON.parse(savedStateString) : undefined;
        if (state !== undefined) {
          setInitialState(state);
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#5F76FE" />
      </View>
    );
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) =>
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
      }
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardTabs} />
            <Stack.Screen name="BookAppointment" component={BookAppointmentScreen} />
            <Stack.Screen name="NotificationPatient" component={NotificationPatient} />
            <Stack.Screen name="Chatbot" component={ChatbotScreen} />
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
  },
  // Custom Tab Bar Styles
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 80,
    backgroundColor: '#5F76FE',
    borderRadius: 19.5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeNotchContainer: {
    position: 'absolute',
    top: -14,
    alignItems: 'center',
    width: 60,
    height: 40,
    zIndex: 1,
  },
  cutoutWrapper: {
    position: 'absolute',
    top: -9,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    transform: [{ scaleX: 1.5 }],
  },
  cutout: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  dot: {
    position: 'absolute',
    top: 1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#5F76FE',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

export default AppNavigator;