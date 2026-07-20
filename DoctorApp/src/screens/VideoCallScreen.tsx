import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientName, patientId, appointmentId, displayAppointmentId, displayPatientId } = route.params || {};

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  const handleEndCall = () => {
    // Navigate to PrescriptionScreen when call ends
    navigation.replace('Prescription', { patientName, patientId, appointmentId, displayAppointmentId, displayPatientId });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Simulated Patient Video */}
      <Image
        source={require('../assets/femalepatient.png')}
        style={styles.videoBackground}
        resizeMode="cover"
      />

      {/* Simulated Local Doctor View */}
      <View style={styles.localVideoContainer}>
        <Ionicons name="person" size={40} color="#FFF" />
      </View>

      {/* Top Bar with Patient Info */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.patientName}>{patientName || 'Patient'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsBackground}>
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} 
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Ionicons name={isVideoOff ? "videocam-off" : "videocam"} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlBtn, isSpeakerOn && styles.controlBtnActive]} 
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            <Ionicons name={isSpeakerOn ? "volume-high" : "volume-mute"} size={24} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlBtn, styles.endCallBtn]} 
            onPress={handleEndCall}
          >
            <Ionicons name="call" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 100,
    height: 140,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
  },
  patientName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsBackground: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    justifyContent: 'space-between',
  },
  controlBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallBtn: {
    backgroundColor: '#FF3B30',
  },
});
