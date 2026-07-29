import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, PermissionsAndroid, Platform, Alert, SafeAreaView } from 'react-native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function VideoCallScreen({ route, navigation }) {
  const { bookingId, roomId, doctorName } = route.params || {};
  const [hasPermissions, setHasPermissions] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [networkQuality, setNetworkQuality] = useState('High Network');
  const [callStatus, setCallStatus] = useState(route.params?.isPatientInitiated ? 'calling' : 'accepted');

  const webViewRef = useRef(null);
  const hasEnded = useRef(false);

  useEffect(() => {
    let timer;
    if (callStatus === 'accepted') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getNetworkBadgeStyle = (quality) => {
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

  const getNetworkIcon = (quality) => {
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

  // Call initiation from Patient to Doctor
  useEffect(() => {
    const initiateCall = async () => {
      if (route.params?.isPatientInitiated && bookingId) {
        try {
          console.log('Initiating patient call for booking:', bookingId);
          // Set call status to 'calling' in Firebase DB via backend
          await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
            bookingId,
            status: 'calling',
          });

          // Send push notification to doctor via backend
          await axios.post(`${API_BASE_URL}/push-notifications/send-call-to-doctor`, {
            bookingId,
            roomId,
            doctorName,
            patientName: route.params?.patientName || 'Patient'
          });
        } catch (error) {
          console.log('Error initiating patient call:', error.message);
        }
      }
    };

    initiateCall();
  }, [bookingId, route.params?.isPatientInitiated]);

  // 2. Poll the backend for call status changes
  useEffect(() => {
    let intervalId;
    let timeoutId;

    if (bookingId && callStatus !== 'ended' && callStatus !== 'rejected') {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/push-notifications/call-status/${bookingId}`);
          const currentStatus = response.data?.status;

          if (currentStatus === 'accepted') {
            setCallStatus('accepted');
          } else if (currentStatus === 'rejected') {
            setCallStatus('rejected');
            clearInterval(intervalId);
            Alert.alert('Call Declined / அழைப்பு நிராகரிக்கப்பட்டது', 'The doctor has declined the call. / மருத்துவர் அழைப்பை நிராகரித்துவிட்டார்.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          } else if (currentStatus === 'ended') {
            setCallStatus('ended');
            clearInterval(intervalId);
            Alert.alert('Call Ended / அழைப்பு முடிந்தது', 'The call has been terminated. / அழைப்பு நிறுத்தப்பட்டது.', [
              { text: 'OK', onPress: () => handleEndCall() }
            ]);
          }
        } catch (error) {
          console.log('Error polling call status:', error.message);
        }
      }, 2000);

      if (callStatus === 'calling') {
        timeoutId = setTimeout(async () => {
          clearInterval(intervalId);
          try {
            await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
              bookingId,
              status: 'ended',
            });
          } catch (e) {
            console.log('Error ending call on timeout:', e.message);
          }
          Alert.alert('No Answer / பதில் இல்லை', 'The doctor did not answer the call. / மருத்துவர் அழைப்பை ஏற்கவில்லை.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }, 35000);
      }
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [bookingId, callStatus]);

  // 3. Local End Call Handler
  const handleEndCall = async () => {
    if (hasEnded.current) return;
    hasEnded.current = true;
    try {
      await axios.put(`${API_BASE_URL}/push-notifications/call-status`, {
        bookingId,
        status: 'ended',
      });
    } catch (error) {
      console.log('Error ending call:', error.message);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard', params: { screen: 'AppointmentTab' } }],
    });
  };

  // 4. Handle redirects (Jitsi/MiroTalk)
  const handleNavigationStateChange = (navState) => {
    const url = navState.url;
    console.log('WebView URL:', url);
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

  // Construct MiroTalk P2P URL
  const targetRoom = roomId || `drz_${bookingId}`;
  const mirotalkUrl = `https://p2p.mirotalk.com/join?room=${targetRoom}&name=Patient&audio=1&video=1`;

  const autoJoinJS = `
    (function() {
      // 1a. Play Calling Ringtone if patient initiated the call
      var isPatientInitiated = ${route.params?.isPatientInitiated ? 'true' : 'false'};
      var ringtone = null;
      if (isPatientInitiated) {
        ringtone = document.getElementById('calling-ringtone');
        if (!ringtone) {
          ringtone = document.createElement('audio');
          ringtone.id = 'calling-ringtone';
          ringtone.src = 'https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg';
          ringtone.loop = true;
          document.body.appendChild(ringtone);
        }
        ringtone.play().catch(function(e) { console.log('Ringtone autoplay blocked/failed: ', e); });
      }

      // 1. Inject Custom CSS to layout video elements:
      // - Muted local video at top-left PIP
      // - Remote video full-screen background
      // - Hide all Web UI buttons, panels and navigation headers
      var style = document.getElementById('custom-webrtc-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'custom-webrtc-style';
        style.type = 'text/css';
        style.innerHTML = ' \
          body, html, #meet, #root, .room { \
            background: #000 !important; \
            overflow: hidden !important; \
          } \
          video[muted], video.muted, video[id*="local"], video[id*="my"], [class*="local"] video { \
            position: fixed !important; \
            top: 20px !important; \
            right: 20px !important; \
            width: 100px !important; \
            height: 150px !important; \
            z-index: 999999 !important; \
            border-radius: 12px !important; \
            border: 2px solid #ffffff !important; \
            box-shadow: 0px 4px 15px rgba(0,0,0,0.5) !important; \
            object-fit: cover !important; \
            display: block !important; \
            visibility: visible !important; \
            opacity: 1 !important; \
          } \
          video:not([muted]), video:not(.muted):not([id*="local"]):not([id*="my"]) { \
            position: fixed !important; \
            top: 0 !important; \
            left: 0 !important; \
            width: 100% !important; \
            height: 100% !important; \
            z-index: 1 !important; \
            object-fit: cover !important; \
            display: block !important; \
            visibility: visible !important; \
            opacity: 1 !important; \
          } \
          #controlPanel, .control-panel, #header, .header, #buttons, .buttons, .toolbar, #toolbar, button, footer, #footer, .footer, \
          #action-menu, .action-menu, #left-menu, #right-menu, .left-menu, .right-menu, .watermark, #watermark, #buttonsBar { \
            display: none !important; \
            visibility: hidden !important; \
            height: 0 !important; \
            width: 0 !important; \
            opacity: 0 !important; \
            pointer-events: none !important; \
          } \
        ';
        document.head.appendChild(style);
      }

      // 2. Loop to keep element parent containers positioned correctly
      setInterval(function() {
        try {
          var mutedVideo = document.querySelector('video[muted], video.muted');
          if (mutedVideo) {
            var container = mutedVideo.parentElement;
            if (container && container !== document.body && container.tagName !== 'BODY') {
              container.style.setProperty('position', 'fixed', 'important');
              container.style.setProperty('top', '20px', 'important');
              container.style.setProperty('right', '20px', 'important');
              container.style.removeProperty('left');
              container.style.setProperty('width', '100px', 'important');
              container.style.setProperty('height', '150px', 'important');
              container.style.setProperty('z-index', '999999', 'important');
            }
          }
        } catch (e) {}
      }, 500);

      // 3. Ringtone control when remote participant has connected
      var lastVideoTime = 0;
      var lastVideoTimeUpdate = Date.now();
      var checkConnectionInterval = setInterval(function() {
        var remoteVideo = document.querySelector('video:not([muted])');
        if (remoteVideo) {
          if (isPatientInitiated && ringtone && !ringtone.paused) {
            ringtone.pause();
          }
        } else {
          if (isPatientInitiated && ringtone && ringtone.paused) {
            ringtone.play().catch(function(e) {});
          }
        }
      }, 1000);

      // 4. Network Quality monitor loop
      var netQualityInterval = setInterval(function() {
        var quality = 'High Network';
        var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
          var rtt = conn.rtt || 0;
          var downlink = conn.downlink || 10;
          var effectiveType = conn.effectiveType || '4g';
          if (effectiveType === '2g' || rtt > 400 || downlink < 1.0) {
            quality = 'Poor Network';
          } else if (effectiveType === '3g' || rtt > 150 || downlink < 3.0) {
            quality = 'Medium Network';
          }
        }

        var remoteVideo = document.querySelector('video:not([muted])');
        if (remoteVideo && remoteVideo.readyState >= 2 && !remoteVideo.paused && !remoteVideo.ended) {
          var curTime = remoteVideo.currentTime;
          if (curTime === lastVideoTime) {
            if (Date.now() - lastVideoTimeUpdate > 3000) {
              quality = 'Poor Network';
            }
          } else {
            lastVideoTime = curTime;
            lastVideoTimeUpdate = Date.now();
          }
        }

        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'network_quality',
            quality: quality
          }));
        }
      }, 2000);
    })();
    true;
  `;

  if (callStatus === 'calling') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.callingWrapper}>
            <Text style={styles.callingTitle}>Calling Doctor...</Text>
            <Text style={styles.callingName}>{doctorName ? `Dr. ${doctorName}` : 'Doctor'}</Text>
            <ActivityIndicator size="large" color="#0D6EFD" style={{ marginVertical: 40 }} />
            <TouchableOpacity style={styles.declineBtn} onPress={handleEndCall}>
              <Icon name="call" size={28} color="#FFF" style={styles.declineIcon} />
              <Text style={styles.declineText}>Cancel Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={2091131945}
        appSign="46a681c87a00d96aa657cddec71f437e6b8647ed1ba5b8ed96bbd99766cb1e1e"
        userID={`pat_${bookingId}`}
        userName={route.params?.patientName || "Patient"}
        callID={targetRoom}
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
  absoluteLoading: {
    ...StyleSheet.absoluteFillObject,
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
});
