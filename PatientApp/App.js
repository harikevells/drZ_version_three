import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import axios from 'axios';
import { AuthProvider } from './src/context/AuthContext'; 
import { LanguageProvider } from './src/context/LanguageContext'; 
import AppNavigator from './src/navigation/AppNavigator';
import CallOverlay from './src/components/CallOverlay';
import { navigate } from './src/navigation/navigationRef';
import { API_BASE_URL } from './src/config';

LogBox.ignoreAllLogs();

const App = () => {
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('FCM Foreground Message received:', remoteMessage);

      if (remoteMessage.data && remoteMessage.data.type === 'incoming_call') {
        const { bookingId, roomId, doctorName } = remoteMessage.data;
        setIncomingCall({ bookingId, roomId, doctorName });
        return; // Skip normal notification display
      }

      // Request permissions (required for iOS)
      await notifee.requestPermission();

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display a notification
      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribe;
  }, []);

  const handleAccept = async () => {
    if (!incomingCall) return;
    const { bookingId, roomId, doctorName } = incomingCall;
    try {
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId,
        status: 'accepted',
      });
      setIncomingCall(null);
      navigate('VideoCall', { bookingId, roomId, doctorName });
    } catch (error) {
      console.error('Error accepting call:', error.message);
      setIncomingCall(null);
    }
  };

  const handleReject = async () => {
    if (!incomingCall) return;
    const { bookingId } = incomingCall;
    try {
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId,
        status: 'rejected',
      });
    } catch (error) {
      console.error('Error rejecting call:', error.message);
    }
    setIncomingCall(null);
  };

  return (
    <AuthProvider>
      <LanguageProvider>  
        <AppNavigator />
        <CallOverlay
          visible={!!incomingCall}
          doctorName={incomingCall?.doctorName}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;