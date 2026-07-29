import React, { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import axios from 'axios';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import MainTabs from './navigation/MainTabs';
import NotificationsScreen from './screens/NotificationsScreen';
import MedicalCampNotification from './screens/MedicalCampNotification';
import VideoCallScreen from './screens/VideoCallScreen';
import PrescriptionScreen from './screens/PrescriptionScreen';
import { navigationRef, navigate } from './navigation/navigationRef';
import CallOverlay from './components/CallOverlay';

const Stack = createNativeStackNavigator();
const API_BASE_URL = 'https://drz-version-three.onrender.com';

interface IncomingCallType {
  bookingId: string;
  roomId: string;
  patientName: string;
}

export default function App() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallType | null>(null);

  useEffect(() => {
    // 1. Listen to foreground push messages from FCM
    const unsubscribeFCM = messaging().onMessage(async remoteMessage => {
      console.log('Doctor App: Foreground message received:', remoteMessage);

      if (remoteMessage.data && remoteMessage.data.type === 'incoming_call') {
        const { bookingId, roomId, patientName } = remoteMessage.data;
        setIncomingCall({
          bookingId: String(bookingId),
          roomId: String(roomId),
          patientName: String(patientName || 'Patient')
        });
        return; // Skip displaying standard notification card
      }

      // Default notification handling
      await notifee.requestPermission();
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

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

    // 2. Check if the app was launched by tapping a notification (while killed)
    notifee.getInitialNotification().then(async notificationDetail => {
      if (notificationDetail) {
        const { pressAction, notification } = notificationDetail;
        if (pressAction && pressAction.id === 'accept_call') {
          const { bookingId, roomId, patientName } = notification.data || {};
          console.log('Doctor App: App launched via Accept call action');
          setTimeout(() => {
            navigate('VideoCall', {
              patientName: String(patientName || 'Patient'),
              patientId: String(bookingId),
              appointmentId: String(bookingId),
              displayAppointmentId: String(bookingId),
              displayPatientId: String(bookingId),
              roomId: String(roomId),
              isIncomingCall: true
            });
          }, 1500);
        }
      }
    });

    // 3. Listen to foreground events from Notifee (taps on notification actions)
    const unsubscribeForeground = notifee.onForegroundEvent(({ type, detail }) => {
      const { notification, pressAction } = detail;
      if (type === EventType.ACTION_PRESS && pressAction?.id === 'accept_call') {
        const { bookingId, roomId, patientName } = notification?.data || {};
        if (notification?.id) {
          notifee.cancelNotification(notification.id);
        }
        navigate('VideoCall', {
          patientName: String(patientName || 'Patient'),
          patientId: String(bookingId),
          appointmentId: String(bookingId),
          displayAppointmentId: String(bookingId),
          displayPatientId: String(bookingId),
          roomId: String(roomId),
          isIncomingCall: true
        });
      } else if (type === EventType.ACTION_PRESS && pressAction?.id === 'decline_call') {
        if (notification?.id) {
          notifee.cancelNotification(notification.id);
        }
      }
    });

    return () => {
      unsubscribeFCM();
      unsubscribeForeground();
    };
  }, []);

  const handleAccept = async () => {
    if (!incomingCall) return;
    const { bookingId, roomId, patientName } = incomingCall;
    try {
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId,
        status: 'accepted',
      });
      setIncomingCall(null);
      navigate('VideoCall', {
        patientName: String(patientName || 'Patient'),
        patientId: String(bookingId),
        appointmentId: String(bookingId),
        displayAppointmentId: String(bookingId),
        displayPatientId: String(bookingId),
        roomId: String(roomId),
        isIncomingCall: true
      });
    } catch (error: any) {
      console.error('Doctor App: Error accepting call:', error.message);
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
    } catch (error: any) {
      console.error('Doctor App: Error rejecting call:', error.message);
    }
    setIncomingCall(null);
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="MedicalCampNotification" component={MedicalCampNotification} />
        <Stack.Screen name="VideoCall" component={VideoCallScreen} />
        <Stack.Screen name="Prescription" component={PrescriptionScreen} />
      </Stack.Navigator>
      <CallOverlay
        visible={!!incomingCall}
        patientName={incomingCall?.patientName}
        onAccept={handleAccept}
        onReject={handleReject}
      />
    </NavigationContainer>
  );
}
