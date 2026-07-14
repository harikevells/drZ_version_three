import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export async function requestUserPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Notification permission denied');
      return false;
    }
  } else if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Notification permission denied');
      return false;
    }
  }
  return true;
}

export async function getFcmToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.log('Error getting FCM token:', error);
    return null;
  }
}

export async function registerTokenWithBackend(token: string, authToken: string, role: string) {
  try {
    await axios.put(
      `${API_BASE_URL}/auth/fcm-token`,
      { fcmToken: token, role: role },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('FCM Token registered with backend');
  } catch (error: any) {
    console.log('Error registering FCM token:', error.message);
  }
}

export async function setupPushNotifications(authToken: string, role: string) {
  const hasPermission = await requestUserPermission();
  if (!hasPermission) return;

  const token = await getFcmToken();
  if (token) {
    await registerTokenWithBackend(token, authToken, role);
  }

  // Listen to whether the token changes
  messaging().onTokenRefresh(token => {
    registerTokenWithBackend(token, authToken, role);
  });
}
