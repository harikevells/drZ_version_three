import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  patientName?: string;
}

export default function CancelModal({ visible, onClose, onConfirm, patientName }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Cancel</Text>
          <Text style={styles.patientName}>{patientName}</Text>
          
          <Text style={styles.message}>Are you sure to Cancel Appointment?</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.yesBtn]} onPress={onConfirm}>
              <Text style={styles.btnText}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={onClose}>
              <Text style={styles.btnTextDark}>No</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  patientName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    width:'100%',
    textAlign:'center'
  },
  message: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 25,
    width:'100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  yesBtn: {
    backgroundColor: '#FF4C4C',
  },
  noBtn: {
    backgroundColor: '#8C8C8C',
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnTextDark: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
