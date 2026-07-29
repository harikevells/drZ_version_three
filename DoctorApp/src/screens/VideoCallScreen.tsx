import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform, PermissionsAndroid } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
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
    loginMobile,
    isIncomingCall
  } = route.params || {};

  const [hasPermissions, setHasPermissions] = useState(false);
  const [callStatus, setCallStatus] = useState<'calling' | 'accepted' | 'rejected' | 'ended' | 'none'>('none');
  const [webviewLoading, setWebviewLoading] = useState(true);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [networkQuality, setNetworkQuality] = useState('High Network');

  const webViewRef = useRef<any>(null);
  const roomId = `drz_${appointmentId}`;

  useEffect(() => {
    let timer: any;
    if (callStatus === 'accepted') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNetworkBadgeStyle = (quality: string) => {
    switch (quality) {
      case 'High Network':
        return { backgroundColor: 'rgba(40, 167, 69, 0.85)' };
      case 'Medium Network':
        return { backgroundColor: 'rgba(255, 193, 7, 0.85)' };
      case 'Poor Network':
        return { backgroundColor: 'rgba(220, 53, 69, 0.85)' };
      default:
        return { backgroundColor: 'rgba(108, 117, 125, 0.85)' };
    }
  };

  const getNetworkIcon = (quality: string) => {
    switch (quality) {
      case 'High Network':
        return 'wifi';
      case 'Medium Network':
        return 'wifi-outline';
      case 'Poor Network':
        return 'warning-outline';
      default:
        return 'wifi-outline';
    }
  };

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
            if (isIncomingCall) {
              setCallStatus('accepted');
            } else {
              startCall();
            }
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
        if (isIncomingCall) {
          setCallStatus('accepted');
        } else {
          startCall();
        }
      }
    };

    requestPermissions();
  }, [isIncomingCall]);

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

  const hasEnded = useRef(false);
  const handleEndCall = async () => {
    if (hasEnded.current) return;
    hasEnded.current = true;
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
      url === 'https://meet.greenhost.net/' ||
      url.includes('close.html') ||
      url.includes('static/close') ||
      url === 'https://p2p.mirotalk.com/' ||
      url.includes('new-room') ||
      url.includes('leave')
    ) {
      handleEndCall();
    }
  };

  const toggleMic = () => {
    if (webViewRef.current) {
      const jsCode = `
        (function() {
          var micBtn = document.querySelector('button[id*="audio"], button[id*="Audio"], button[id*="mic"], button[id*="Mic"], div[aria-label*="Mute"], div[aria-label*="mute"], button[aria-label*="Mute"], button[aria-label*="mute"], [data-testid="audio-mute"]');
          if (micBtn) {
            micBtn.click();
          }
          var localVideo = document.querySelector('video[muted], video.muted, video[id*="local"], video[id*="my"], [class*="local"] video');
          if (localVideo && localVideo.srcObject) {
            var audioTracks = localVideo.srcObject.getAudioTracks();
            audioTracks.forEach(function(track) {
              track.enabled = ${isMuted ? 'true' : 'false'};
            });
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (webViewRef.current) {
      const jsCode = `
        (function() {
          var videoBtn = document.querySelector('button[id*="video"], button[id*="Video"], button[id*="camera"], button[id*="Camera"], div[aria-label*="camera"], div[aria-label*="Camera"], button[aria-label*="camera"], button[aria-label*="Camera"], [data-testid="video-mute"]');
          if (videoBtn) {
            videoBtn.click();
          }
          var localVideo = document.querySelector('video[muted], video.muted, video[id*="local"], video[id*="my"], [class*="local"] video');
          if (localVideo && localVideo.srcObject) {
            var videoTracks = localVideo.srcObject.getVideoTracks();
            videoTracks.forEach(function(track) {
              track.enabled = ${isVideoOff ? 'true' : 'false'};
            });
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = () => {
    if (webViewRef.current) {
      const jsCode = `
        (function() {
          var swapBtn = document.querySelector('button[id*="swap"], button[id*="switch"], button[id*="flip"], [class*="swap"], [class*="switch"], [class*="flip"]');
          if (swapBtn) {
            swapBtn.click();
          }
          if (window.APP && window.APP.store) {
            try {
              window.APP.store.dispatch({ type: 'TOGGLE_CAMERA' });
            } catch(e) {}
          }
        })();
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
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

  return (
    <SafeAreaView style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={2091131945}
        appSign="46a681c87a00d96aa657cddec71f437e6b8647ed1ba5b8ed96bbd99766cb1e1e"
        userID={`doc_${appointmentId}`}
        userName={doctorName || "Doctor"}
        callID={roomId}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onCallEnd: handleEndCall,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#0F172A',
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
  absoluteLoading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 15,
    zIndex: 20,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControlBtn: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  hangupBtn: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
  callInfoOverlay: {
    position: 'absolute',
    bottom: 125,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  participantNameText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 4,
  },
  durationText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginBottom: 8,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  networkBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
