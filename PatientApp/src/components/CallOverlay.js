import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Sound from 'react-native-sound';

export default function CallOverlay({ visible, doctorName, onAccept, onReject }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringtoneRef = useRef(null);

  useEffect(() => {
    // Enable playback in silence mode
    Sound.setCategory('Playback');

    if (visible) {
      const sound = new Sound('https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Opening.mp3', '', (error) => {
        if (error) {
          console.log('Failed to load ringing sound:', error);
          return;
        }
        sound.setNumberOfLoops(-1); // Loop indefinitely
        sound.play((success) => {
          if (!success) {
            console.log('Playback failed due to audio decoding errors');
          }
        });
      });
      ringtoneRef.current = sound;
    } else {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop(() => {
          if (ringtoneRef.current) {
            ringtoneRef.current.release();
            ringtoneRef.current = null;
          }
        });
      }
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current.release();
        ringtoneRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible]);

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.subTitle}>INCOMING VIDEO CALL</Text>
          <Text style={styles.title}>Dr. {doctorName || 'Doctor'}</Text>

          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[
                styles.pulseCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            />
            <View style={styles.avatar}>
              <Icon name="person" size={60} color="#0D6EFD" />
            </View>
          </View>

          <Text style={styles.statusText}>Ringing...</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={onReject}
            >
              <Icon name="call" size={28} color="#FFF" style={styles.rejectIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={onAccept}
            >
              <Icon name="videocam" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '85%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  subTitle: {
    color: '#0D6EFD',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(13, 110, 253, 0.2)',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  statusText: {
    color: '#AAA',
    fontSize: 16,
    marginBottom: 60,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  btn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  acceptBtn: {
    backgroundColor: '#2CD95C',
  },
  rejectBtn: {
    backgroundColor: '#FF3B30',
  },
  rejectIcon: {
    transform: [{ rotate: '135deg' }],
  },
});
