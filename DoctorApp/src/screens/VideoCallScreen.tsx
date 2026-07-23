import React, { useEffect, useState, useRef } from 'react';
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
      url === 'https://meet.ffmuc.net/' ||
      url.includes('close.html') ||
      url.includes('static/close')
    ) {
      handleEndCall();
    }
  };

  const toggleMic = () => {
    if (webViewRef.current) {
      const jsCode = `
        (function() {
          var successfullyToggled = false;
          var micBtn = document.querySelector('div[aria-label*="Mute"], div[aria-label*="mute"], button[aria-label*="Mute"], button[aria-label*="mute"], [data-testid="audio-mute"]');
          if (micBtn) {
            micBtn.click();
            successfullyToggled = true;
          }
          if (!successfullyToggled && window.APP && window.APP.conference) {
            try {
              var isMuted = window.APP.conference.isLocalAudioMuted();
              window.APP.conference.muteAudio(!isMuted);
              successfullyToggled = true;
            } catch(e) {}
          }
          if (!successfullyToggled) {
            var event = new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', keyCode: 77, which: 77, bubbles: true });
            document.dispatchEvent(event);
          }
        })();
      `;
      webViewRef.current.injectJavaScript(jsCode);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (webViewRef.current) {
      const jsCode = `
        (function() {
          var successfullyToggled = false;
          var videoBtn = document.querySelector('div[aria-label*="camera"], div[aria-label*="Camera"], button[aria-label*="camera"], button[aria-label*="Camera"], [data-testid="video-mute"]');
          if (videoBtn) {
            videoBtn.click();
            successfullyToggled = true;
          }
          if (!successfullyToggled && window.APP && window.APP.conference) {
            try {
              var isMuted = window.APP.conference.isLocalVideoMuted();
              window.APP.conference.muteVideo(!isMuted);
              successfullyToggled = true;
            } catch(e) {}
          }
          if (!successfullyToggled) {
            var event = new KeyboardEvent('keydown', { key: 'v', code: 'KeyV', keyCode: 86, which: 86, bubbles: true });
            document.dispatchEvent(event);
          }
        })();
      `;
      webViewRef.current.injectJavaScript(jsCode);
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = () => {
    if (webViewRef.current) {
      const jsCode = `
        (function() {
          var successfullySwitched = false;
          
          // 1. Try Jitsi Redux TOGGLE_CAMERA
          if (window.APP && window.APP.store) {
            try {
              window.APP.store.dispatch({ type: 'TOGGLE_CAMERA' });
              successfullySwitched = true;
            } catch(e) {
              console.warn('TOGGLE_CAMERA failed: ', e);
            }
          }
          
          // 2. Try Jitsi Redux SET_CAMERA_FACING_MODE
          if (!successfullySwitched && window.APP && window.APP.store) {
            try {
              var mediaState = window.APP.store.getState()['features/base/media'];
              var currentFacingMode = mediaState && mediaState.video ? mediaState.video.facingMode : 'user';
              var nextFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
              window.APP.store.dispatch({
                type: 'SET_CAMERA_FACING_MODE',
                cameraFacingMode: nextFacingMode
              });
              successfullySwitched = true;
            } catch(e) {
              console.warn('SET_CAMERA_FACING_MODE failed: ', e);
            }
          }
          
          // 3. Try Jitsi Redux SET_VIDEO_INPUT_DEVICE
          if (!successfullySwitched && window.APP && window.APP.store && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            navigator.mediaDevices.enumerateDevices()
              .then(function(devices) {
                var videoDevices = devices.filter(function(d) { return d.kind === 'videoinput'; });
                if (videoDevices.length > 1) {
                  var currentState = window.APP.store.getState();
                  var currentDeviceId = currentState['features/base/devices'] ? currentState['features/base/devices'].videoInputDeviceId : null;
                  var currentIndex = -1;
                  for (var i = 0; i < videoDevices.length; i++) {
                    if (videoDevices[i].deviceId === currentDeviceId) {
                      currentIndex = i;
                      break;
                    }
                  }
                  var nextIndex = (currentIndex + 1) % videoDevices.length;
                  var nextDeviceId = videoDevices[nextIndex].deviceId;
                  window.APP.store.dispatch({
                    type: 'SET_VIDEO_INPUT_DEVICE',
                    deviceId: nextDeviceId
                  });
                }
              })
              .catch(function(err) {
                console.warn('Error in fallback switch camera: ', err);
              });
          }
        })();
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

  const displayNameParam = encodeURIComponent(`"Dr. ${doctorName || 'Doctor'}"`);
  const jitsiUrl = `https://meet.ffmuc.net/${roomId}#userInfo.displayName=${displayNameParam}&config.prejoinPageEnabled=false&config.analytics.disabled=true&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.toolbarButtons=[]&config.disableHeader=true&config.hideConferenceSubject=true&config.hideConferenceTimer=true&config.tileViewEnabled=false&config.filmStripOnly=false&config.p2p.enabled=false&config.disableDeepLinking=true&interfaceConfig.MOBILE_APP_PROMO=false`;

  const autoJoinJS = `
    (function() {
      var lastVideoTime = 0;
      var lastVideoTimeUpdate = Date.now();

      // 1. Inject Custom CSS for local video preview positioning (top right floating box)
      var style = document.getElementById('custom-local-video-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'custom-local-video-style';
        style.type = 'text/css';
        style.innerHTML = ' \
          .filmstrip, .filmstrip__videos, .filmstrip-container, #filmstripLocalVideoContainer { \
            display: block !important; \
            visibility: visible !important; \
            opacity: 1 !important; \
            background: transparent !important; \
            background-color: transparent !important; \
            border: none !important; \
            box-shadow: none !important; \
            pointer-events: none !important; \
          } \
          #filmstripLocalVideo, [id*="LocalVideo"], [id*="localVideo"], .local-video { \
            position: fixed !important; \
            top: 20px !important; \
            right: 20px !important; \
            width: 100px !important; \
            height: 150px !important; \
            z-index: 999999 !important; \
            border-radius: 12px !important; \
            border: 2px solid #ffffff !important; \
            box-shadow: 0px 4px 15px rgba(0,0,0,0.5) !important; \
            overflow: hidden !important; \
            display: block !important; \
            visibility: visible !important; \
            opacity: 1 !important; \
            pointer-events: auto !important; \
          } \
          #filmstripLocalVideo video, [id*="LocalVideo"] video, [id*="localVideo"] video, .local-video video { \
            width: 100% !important; \
            height: 100% !important; \
            object-fit: cover !important; \
          } \
          .filmstrip__video-container:not(#filmstripLocalVideo) { \
            display: none !important; \
          } \
        ';
        document.head.appendChild(style);
      }

      // 2. Auto-Join loop
      var joinInterval = setInterval(function() {
        var joinBtn = document.querySelector('button[aria-label*="Join"], div[aria-label*="Join"], button[class*="join"], .join-btn');
        if (joinBtn) {
          joinBtn.click();
          clearInterval(joinInterval);
          return;
        }
        var buttons = document.querySelectorAll('button, div[role="button"]');
        for (var i = 0; i < buttons.length; i++) {
          var txt = buttons[i].textContent || buttons[i].innerText;
          if (txt && txt.toLowerCase().indexOf('join') !== -1) {
            buttons[i].click();
            clearInterval(joinInterval);
            break;
          }
        }
      }, 200);

      // 3. Safe One-Time Auto-Unmute Video/Audio to start streams correctly without toggle loops
      if (!window.hasAttemptedAutoUnmute) {
        window.hasAttemptedAutoUnmute = true;
        setTimeout(function() {
          if (window.APP && window.APP.store) {
            try {
              var mediaState = window.APP.store.getState()['features/base/media'];
              
              var isVideoMuted = mediaState && mediaState.video ? mediaState.video.muted : true;
              if (isVideoMuted) {
                try {
                  window.APP.store.dispatch({ type: 'SET_VIDEO_MUTED', muted: false });
                } catch(err) {}
                var videoBtn = document.querySelector('div[aria-label*="camera"], div[aria-label*="Camera"], button[aria-label*="camera"], button[aria-label*="Camera"], [data-testid="video-mute"]');
                if (videoBtn) {
                  videoBtn.click();
                } else if (window.APP.conference && typeof window.APP.conference.muteVideo === 'function') {
                  window.APP.conference.muteVideo(false);
                }
              }

              var isAudioMuted = mediaState && mediaState.audio ? mediaState.audio.muted : true;
              if (isAudioMuted) {
                try {
                  window.APP.store.dispatch({ type: 'SET_AUDIO_MUTED', muted: false });
                } catch(err) {}
                var micBtn = document.querySelector('div[aria-label*="Mute"], div[aria-label*="mute"], button[aria-label*="Mute"], button[aria-label*="mute"], [data-testid="audio-mute"]');
                if (micBtn) {
                  micBtn.click();
                } else if (window.APP.conference && typeof window.APP.conference.muteAudio === 'function') {
                  window.APP.conference.muteAudio(false);
                }
              }
            } catch(e) {}
          }
        }, 3000);
      }

      // 4. Auto-Pin Remote Participant & Disable Tile View to force remote video full screen
      var pinInterval = setInterval(function() {
        if (window.APP && window.APP.store) {
          try {
            var state = window.APP.store.getState();
            
            // 4a. Disable tile view if enabled
            var videoLayout = state['features/video-layout'];
            var tileViewEnabled = videoLayout ? videoLayout.tileViewEnabled : true;
            if (tileViewEnabled) {
              window.APP.store.dispatch({
                type: 'SET_TILE_VIEW',
                enabled: false
              });
            }

            // 4b. Find and pin remote participant
            var participants = state['features/base/participants'];
            var remoteId = null;
            for (var id in participants) {
              if (participants[id] && !participants[id].local) {
                remoteId = id;
                break;
              }
            }
            
            if (remoteId) {
              var pinnedState = state['features/pinned-participants'];
              var isPinned = false;
              if (pinnedState) {
                if (Array.isArray(pinnedState)) {
                  isPinned = pinnedState.indexOf(remoteId) !== -1;
                } else if (typeof pinnedState === 'object') {
                  isPinned = pinnedState.pinnedId === remoteId || (pinnedState.ids && pinnedState.ids.indexOf(remoteId) !== -1);
                }
              }
              if (!isPinned) {
                if (window.APP.conference && typeof window.APP.conference.pinParticipant === 'function') {
                  try {
                    window.APP.conference.pinParticipant(remoteId);
                  } catch(err) {}
                }
                window.APP.store.dispatch({
                  type: 'PIN_PARTICIPANT',
                  id: remoteId,
                  participantId: remoteId
                });
              }
            }
          } catch(e) {}
        }
      }, 1000);

      // 5. Network Quality monitor loop
      var netQualityInterval = setInterval(function() {
        var quality = 'High Network';
        
        // Check 1: WebRTC/Browser Connection Info
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
        
        // Check 2: Jitsi Connection State fallback
        if (window.APP && window.APP.conference) {
          try {
            var connectionState = window.APP.conference.getConnectionState();
            if (connectionState === 'interrupted' || connectionState === 'failed') {
              quality = 'Poor Network';
            }
          } catch(e) {}
        }

        // Check 3: Detect Frozen/Hung Video Element (remote participant)
        var remoteVideos = document.querySelectorAll('video');
        var isRemoteVideoFrozen = false;
        for (var i = 0; i < remoteVideos.length; i++) {
          var vid = remoteVideos[i];
          // Skip local video inside filmstripLocalVideo
          var isLocal = false;
          var parent = vid.parentElement;
          while (parent) {
            if (parent.id === 'filmstripLocalVideo' || (parent.className && parent.className.indexOf('local') !== -1)) {
              isLocal = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (isLocal) continue;
          
          // Check if remote video is frozen
          if (vid.readyState >= 2 && !vid.paused && !vid.ended) {
            var curTime = vid.currentTime;
            if (curTime === lastVideoTime) {
              if (Date.now() - lastVideoTimeUpdate > 3000) {
                isRemoteVideoFrozen = true;
              }
            } else {
              lastVideoTime = curTime;
              lastVideoTimeUpdate = Date.now();
            }
          }
        }
        
        if (isRemoteVideoFrozen) {
          quality = 'Poor Network';
        }

        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'network_quality',
            quality: quality
          }));
        }
      }, 2000);

      // Clear join interval after 12 seconds
      setTimeout(function() {
        clearInterval(joinInterval);
      }, 12000);
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.webviewContainer}>
        {/* Debug Room ID Banner */}
        <View style={{ position: 'absolute', top: 80, left: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 5 }}>
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>Room: {roomId}</Text>
        </View>

        <WebView
          ref={webViewRef}
          source={{ uri: jitsiUrl }}
          style={{ flex: 1 }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          onLoadEnd={() => setWebviewLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          permissionGrantingBehavior="grant"
          mediaCapturePermissionGrantType="grant"
          androidHardwareAccelerationDisabled={false}
          onPermissionRequest={(request) => {
            request.grant(request.resources);
          }}
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onMessage={(event: any) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'network_quality') {
                setNetworkQuality(data.quality);
              }
            } catch(e) {}
          }}
          userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
          injectedJavaScript={autoJoinJS}
        />

        {webviewLoading && (
          <View style={styles.absoluteLoading}>
            <ActivityIndicator size="large" color="#0D6EFD" />
            <Text style={styles.loadingText}>Connecting to video server...</Text>
          </View>
        )}

        {/* Floating Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleEndCall}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>

        {/* Call Info Overlay (Name, Duration, Network Quality) */}
        {!webviewLoading && (
          <View style={styles.callInfoOverlay}>
            <Text style={styles.participantNameText}>
              {patientName || 'Patient'}
            </Text>
            <Text style={styles.durationText}>
              {formatDuration(seconds)}
            </Text>
            <View style={[styles.networkBadge, getNetworkBadgeStyle(networkQuality)]}>
              <Ionicons name={getNetworkIcon(networkQuality)} size={12} color="#FFF" style={{ marginRight: 5 }} />
              <Text style={styles.networkBadgeText}>{networkQuality}</Text>
            </View>
          </View>
        )}

        {/* Custom Bottom Control Bar */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, isVideoOff && styles.activeControlBtn]} onPress={toggleVideo}>
            <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, styles.hangupBtn]} onPress={handleEndCall}>
            <Ionicons name="call" size={28} color="#FFF" style={styles.hangupIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlBtn, isMuted && styles.activeControlBtn]} onPress={toggleMic}>
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
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
});
