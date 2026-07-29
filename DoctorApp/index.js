import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidCategory, EventType } from '@notifee/react-native';
import axios from 'axios';

const API_BASE_URL = 'https://drz-version-three.onrender.com';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Doctor App: Message handled in the background!', remoteMessage);

  if (remoteMessage.data && remoteMessage.data.type === 'incoming_call') {
    const { bookingId, roomId, patientName } = remoteMessage.data;

    // Create channel
    const channelId = await notifee.createChannel({
      id: 'incoming-calls',
      name: 'Incoming Calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
    });

    // Display notification with actions
    await notifee.displayNotification({
      id: bookingId,
      title: 'Incoming Video Call / வீடியோ அழைப்பு',
      body: `${patientName || 'Patient'} is calling you...`,
      data: {
        bookingId,
        roomId,
        patientName
      },
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.CALL,
        fullScreenAction: {
          id: 'default',
        },
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Accept',
            pressAction: {
              id: 'accept_call',
              launchActivity: 'default',
            },
          },
          {
            title: 'Decline',
            pressAction: {
              id: 'decline_call',
            },
          },
        ],
      },
    });
  }
});

// Handle Notifee background events (e.g. Accept / Decline click)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  const bookingId = notification?.data?.bookingId;

  if (type === EventType.ACTION_PRESS) {
    if (pressAction.id === 'accept_call') {
      console.log('Doctor App: User clicked Accept from background event');
      try {
        await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
          bookingId,
          status: 'accepted'
        });
      } catch (err) {
        console.error('Doctor App: Error setting accept in background:', err.message);
      }
      await notifee.cancelNotification(notification.id);
    } else if (pressAction.id === 'decline_call') {
      console.log('Doctor App: User clicked Decline from background event');
      try {
        await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
          bookingId,
          status: 'rejected'
        });
      } catch (err) {
        console.error('Doctor App: Error setting decline in background:', err.message);
      }
      await notifee.cancelNotification(notification.id);
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
