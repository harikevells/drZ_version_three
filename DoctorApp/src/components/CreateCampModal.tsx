import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

const API_URL = 'http://10.10.11.90:5000/api/medical-camps';

interface CreateCampModalProps {
  visible: boolean;
  onClose: () => void;
  doctorName: string;
}

export default function CreateCampModal({ visible, onClose, doctorName }: CreateCampModalProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.5,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setImageUrl(`data:${asset.type};base64,${asset.base64}`);
        }
      }
    } catch (err) {
      console.log('Image picker error', err);
      Alert.alert('Error', 'Image upload failed. Please make sure to rebuild the Doctor App (run-android) after adding the Image Picker.');
    }
  };

  const handleCreate = async () => {
    if (!title || !subtitle) {
      Alert.alert('Error', 'Please fill in all details.');
      return;
    }

    setLoading(true);
    try {
      const formattedFromDate = `${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`;
      const formattedToDate = `${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`;
      
      const payload = {
        title,
        subtitle,
        fromDate: formattedFromDate,
        toDate: formattedToDate,
        doctorName,
        image: imageUrl || 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png'
      };

      await axios.post(API_URL, payload);
      Alert.alert('Success', 'Medical Camp created successfully!');
      
      // Reset
      setTitle('');
      setSubtitle('');
      setFromDate(new Date());
      setToDate(new Date());
      setImageUrl('');
      
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Failed to create Medical Camp');
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.headerTitle}>Create Medical Camp</Text>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Camp Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Free Eye Checkup"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Subtitle / Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief details about the camp"
              value={subtitle}
              onChangeText={setSubtitle}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>From Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
                  <Text style={styles.dateText}>
                    {`${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`}
                  </Text>
                  <Icon name="calendar" size={20} color="#666" />
                </TouchableOpacity>

                {showFromPicker && (
                  <DateTimePicker
                    value={fromDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowFromPicker(false);
                      if (selectedDate) setFromDate(selectedDate);
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>To Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
                  <Text style={styles.dateText}>
                    {`${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`}
                  </Text>
                  <Icon name="calendar" size={20} color="#666" />
                </TouchableOpacity>

                {showToPicker && (
                  <DateTimePicker
                    value={toDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowToPicker(false);
                      if (selectedDate) setToDate(selectedDate);
                    }}
                  />
                )}
              </View>
            </View>

            <Text style={styles.label}>Camp Banner Image</Text>
            <TouchableOpacity 
              style={[styles.uploadBtn, imageUrl ? styles.uploadedBtn : null]} 
              onPress={handleImagePick}
            >
              <Icon name={imageUrl ? "check-circle" : "cloud-upload"} size={24} color={imageUrl ? "#2CA01C" : "#0066FF"} />
              <Text style={[styles.uploadText, imageUrl ? { color: '#2CA01C' } : null]}>
                {imageUrl ? "Image Selected Successfully" : "Click to Pick Image from Gallery"}
              </Text>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
                <Text style={styles.createText}>{loading ? 'Creating...' : 'Create Camp'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    alignItems: 'center'
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 20,
    textAlign: 'center'
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    marginTop: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333'
  },
  dateBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  dateText: {
    fontSize: 14,
    color: '#333'
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0066FF',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 5
  },
  uploadedBtn: {
    borderColor: '#2CA01C',
    backgroundColor: '#EFFFEC'
  },
  uploadText: {
    marginLeft: 10,
    color: '#0066FF',
    fontWeight: 'bold'
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center'
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold'
  },
  createBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    alignItems: 'center'
  },
  createText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});
