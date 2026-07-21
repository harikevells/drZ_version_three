import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, PermissionsAndroid, Platform, Alert, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function VideoCallScreen({ route, navigation }) {
  const { bookingId, roomId, doctorName } = route.params || {};
  const [hasPermissions, setHasPermissions] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Request Camera and Audio permissions
  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);

          const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
          const micGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

          if (cameraGranted && micGranted) {
            setHasPermissions(true);
          } else {
            Alert.alert(
              'Permissions Required',
              'Camera and Microphone permissions are required for the video call.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        } catch (err) {
          console.warn('Permission error:', err);
          navigation.goBack();
        }
      } else {
        setHasPermissions(true);
      }
    };

    checkAndRequestPermissions();
  }, []);

  // 2. Poll the backend for call status changes
  useEffect(() => {
    let intervalId;

    if (bookingId) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/push-notifications/call-status/${bookingId}`);
          if (response.data && (response.data.status === 'ended' || response.data.status === 'rejected')) {
            console.log('Call ended by remote user, exiting VideoCallScreen.');
            clearInterval(intervalId);
            Alert.alert('Call Ended', 'The call has been terminated.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        } catch (error) {
          console.log('Error polling call status:', error.message);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [bookingId]);

  // 3. Local End Call Handler
  const handleEndCall = async () => {
    try {
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId,
        status: 'ended',
      });
    } catch (error) {
      console.log('Error ending call:', error.message);
    }
    navigation.goBack();
  };

  // 4. Handle Jitsi page redirects (like closing/end call page)
  const handleNavigationStateChange = (navState) => {
    const url = navState.url;
    console.log('WebView URL:', url);
    if (
      url === 'https://meet.jit.si/' ||
      url.includes('close.html') ||
      url.includes('static/close')
    ) {
      handleEndCall();
    }
  };

  if (!hasPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D6EFD" />
        <Text style={styles.loadingText}>Initializing camera & audio...</Text>
      </View>
    );
  }

  // Construct Jitsi URL with configuration parameters to disable prejoin page
  const jitsiUrl = `https://meet.jit.si/${roomId || 'drz_meeting'}#userInfo.displayName="Patient"&config.prejoinPageEnabled=false&config.analytics.disabled=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Call with Dr. {doctorName || 'Doctor'}</Text>
      </View>

      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: jitsiUrl }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36"
        />
        {loading && (
          <View style={styles.absoluteLoading}>
            <ActivityIndicator size="large" color="#0D6EFD" />
            <Text style={styles.loadingText}>Connecting to video server...</Text>
          </View>
        )}
      </View>

      {/* Polish floating Hang Up button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
          <Icon name="call" size={30} color="#FFF" style={styles.endCallIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 15,
    fontSize: 16,
  },
  header: {
    height: 50,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  absoluteLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  endCallBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
