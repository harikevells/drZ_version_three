import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  patientName?: string;
}

export default function CompleteModal({ visible, onClose, onComplete, patientName }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Complete Booking</Text>
          <Text style={styles.patientName}>{patientName}</Text>
          
          <Text style={styles.message}>Are you sure to complete this booking?</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.btnTextDark}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.completeBtn]} onPress={onComplete}>
              <Text style={styles.btnText}>Complete</Text>
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
    marginBottom: 25,
    width:'100%',
    textAlign:'center'
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
  completeBtn: {
    backgroundColor: '#2CA01C',
  },
  cancelBtn: {
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
