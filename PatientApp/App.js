import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { AuthProvider } from './src/context/AuthContext'; 
import { LanguageProvider } from './src/context/LanguageContext'; 
import AppNavigator from './src/navigation/AppNavigator';

LogBox.ignoreAllLogs();

const App = () => {
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
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
          smallIcon: 'ic_launcher', // Optional, defaults to 'ic_launcher'.
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribe;
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>  
        <AppNavigator />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;