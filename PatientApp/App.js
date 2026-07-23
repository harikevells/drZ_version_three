import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
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
    // 1. Listen to FCM foreground messages
    const unsubscribeFCM = messaging().onMessage(async remoteMessage => {
      console.log('FCM Foreground Message received:', remoteMessage);

      if (remoteMessage.data && remoteMessage.data.type === 'incoming_call') {
        const { bookingId, roomId, doctorName } = remoteMessage.data;
        setIncomingCall({ bookingId, roomId, doctorName });
        return; // Skip displaying a notification card since overlay is active
      }

      // Request permissions (required for iOS)
      await notifee.requestPermission();

      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      // Display normal notifications
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

    // 2. Check if the app was launched by pressing a notification action (e.g. while killed)
    notifee.getInitialNotification().then(async notificationDetail => {
      if (notificationDetail) {
        const { pressAction, notification } = notificationDetail;
        if (pressAction && pressAction.id === 'accept_call') {
          const { bookingId, roomId, doctorName } = notification.data;
          console.log('App launched via Accept call action');
          // Navigate to VideoCall screen after navigation is ready
          setTimeout(() => {
            navigate('VideoCall', { bookingId, roomId, doctorName });
          }, 1500);
        }
      }
    });

    // 3. Listen to foreground events from Notifee (e.g. if the user clicks Accept/Decline)
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      const { notification, pressAction } = detail;
      if (type === EventType.ACTION_PRESS && pressAction?.id === 'accept_call') {
        const { bookingId, roomId, doctorName } = notification.data;
        notifee.cancelNotification(notification.id);
        navigate('VideoCall', { bookingId, roomId, doctorName });
      } else if (type === EventType.ACTION_PRESS && pressAction?.id === 'decline_call') {
        notifee.cancelNotification(notification.id);
      }
    });

    return () => {
      unsubscribeFCM();
      unsubscribeForeground();
    };
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