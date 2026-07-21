import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function VideoCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { 
    patientName, 
    patientId, 
    appointmentId, 
    displayAppointmentId, 
    displayPatientId,
    doctorName,
    loginMobile
  } = route.params || {};

  const [hasPermissions, setHasPermissions] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'accepted' | 'rejected' | 'ended' | 'none'>('none');
  const [webviewLoading, setWebviewLoading] = useState(true);

  const roomId = `drz_${appointmentId}`;

  // 1. Request permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
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
            startCall();
          } else {
            Alert.alert(
              'Permissions Required',
              'Camera and Microphone permissions are required for the video call.',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        } catch (err) {
          console.warn('Permission request error:', err);
          navigation.goBack();
        }
      } else {
        setHasPermissions(true);
        startCall();
      }
    };

    requestPermissions();
  }, []);

  // 2. Start call logic (Write status and send FCM notification)
  const startCall = async () => {
    try {
      setCallStatus('calling');
      
      // Initialize call in Realtime DB
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId: appointmentId,
        status: 'calling',
      });

      // Send FCM push notification to patient
      if (loginMobile) {
        await axios.post(`${API_BASE_URL}/push-notifications/send-call`, {
          bookingId: appointmentId,
          roomId,
          doctorName: doctorName || 'Doctor',
          patientMobile: loginMobile
        });
      } else {
        console.warn('No patient login mobile found to send call notification.');
      }
    } catch (error: any) {
      console.log('Error starting call:', error.message);
    }
  };

  // 3. Poll call status
  useEffect(() => {
    let intervalId: any;
    let timeoutId: any;

    if (hasPermissions && callStatus !== 'none' && callStatus !== 'ended') {
      // Poll call status every 2 seconds
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/push-notifications/call-status/${appointmentId}`);
          const currentStatus = response.data?.status;

          if (currentStatus === 'accepted') {
            setCallStatus('accepted');
          } else if (currentStatus === 'rejected') {
            setCallStatus('rejected');
            clearInterval(intervalId);
            Alert.alert('Call Declined', 'The patient has declined the call.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          } else if (currentStatus === 'ended') {
            setCallStatus('ended');
            clearInterval(intervalId);
            handleEndCall();
          }
        } catch (error: any) {
          console.log('Error polling call status:', error.message);
        }
      }, 2000);

      // Call timeout if patient doesn't answer in 35 seconds
      timeoutId = setTimeout(async () => {
        if (callStatus === 'calling') {
          clearInterval(intervalId);
          await endCallInDb();
          Alert.alert('No Answer', 'The patient did not answer the call.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      }, 35000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [hasPermissions, callStatus]);

  const endCallInDb = async () => {
    try {
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId: appointmentId,
        status: 'ended',
      });
    } catch (error: any) {
      console.log('Error ending call in DB:', error.message);
    }
  };

  const handleEndCall = async () => {
    await endCallInDb();
    // Navigate to PrescriptionScreen when call ends
    navigation.replace('Prescription', { 
      patientName, 
      patientId, 
      appointmentId, 
      displayAppointmentId, 
      displayPatientId 
    });
  };

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    console.log('WebView URL changed:', url);
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

  if (callStatus === 'calling') {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.callingWrapper}>
          <Text style={styles.callingTitle}>Calling Patient...</Text>
          <Text style={styles.callingName}>{patientName}</Text>
          <ActivityIndicator size="large" color="#0D6EFD" style={{ marginVertical: 40 }} />
          <TouchableOpacity style={styles.declineBtn} onPress={handleEndCall}>
            <Ionicons name="call" size={28} color="#FFF" style={styles.declineIcon} />
            <Text style={styles.declineText}>Cancel Call</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const jitsiUrl = `https://meet.jit.si/${roomId}#userInfo.displayName="Dr. ${doctorName || 'Doctor'}"&config.prejoinPageEnabled=false&config.analytics.disabled=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Call with {patientName}</Text>
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
          onLoadEnd={() => setWebviewLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Mobile Safari/537.36"
        />
        {webviewLoading && (
          <View style={styles.absoluteLoading}>
            <ActivityIndicator size="large" color="#0D6EFD" />
            <Text style={styles.loadingText}>Connecting to video server...</Text>
          </View>
        )}
      </View>

      {/* Floating Hang Up button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
          <Ionicons name="call" size={30} color="#FFF" style={styles.endCallIcon} />
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
  callingWrapper: {
    alignItems: 'center',
    width: '80%',
  },
  callingTitle: {
    color: '#0D6EFD',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  callingName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  declineBtn: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 4,
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
    marginRight: 10,
  },
  declineText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
