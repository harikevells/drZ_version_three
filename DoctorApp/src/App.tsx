import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';
import NotificationsScreen from './screens/NotificationsScreen';
import ChatBotBookingScreen from './screens/ChatBotBookingScreen';
import AddPrescriptionScreen from './screens/AddPrescriptionScreen';
import { requestUserPermission, notificationListener } from './utils/pushNotification';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    requestUserPermission();
    notificationListener();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ChatBotBooking" component={ChatBotBookingScreen} />
        <Stack.Screen name="AddPrescription" component={AddPrescriptionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
