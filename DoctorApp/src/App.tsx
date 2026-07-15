import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';
import NotificationsScreen from './screens/NotificationsScreen';
import ChatBotBookingScreen from './screens/ChatBotBookingScreen';
import { requestUserPermission, notificationListener } from './utils/pushNotification';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    requestUserPermission();
    notificationListener();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="ChatBotBooking" component={ChatBotBookingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
