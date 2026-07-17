import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator, Switch, FlatList, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Header from '../components/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';

const API_URL = 'http://10.10.11.90:5000/api/medical-camps';

export default function PushMessagesScreen() {
  const [doctorName, setDoctorName] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState(''); // description
  const [fromDate, setFromDate] = useState<Date>(new Date());
  const [toDate, setToDate] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // List State
  const [camps, setCamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (doctorName) {
      fetchCamps();
    }
  }, [doctorName]);

  const loadUser = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        setDoctorName(user.doctorName);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/${encodeURIComponent(doctorName)}`);
      setCamps(response.data);
    } catch (error) {
      console.error('Error fetching camps:', error);
    } finally {
      setLoading(false);
    }
  };

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
      Alert.alert('Error', 'Image upload failed.');
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setFromDate(new Date());
    setToDate(new Date());
    setImageUrl('');
    setIsActive(true);
    setCreateModalVisible(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id || item._id);
    setTitle(item.title);
    setSubtitle(item.subtitle);
    if (item.fromDate) {
      const parts = item.fromDate.split('/');
      if (parts.length === 3) setFromDate(new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
    }
    if (item.toDate) {
      const parts = item.toDate.split('/');
      if (parts.length === 3) setToDate(new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
    }
    setImageUrl(item.image || '');
    setIsActive(item.active !== false);
    setCreateModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!title || !subtitle) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setCreating(true);
    try {
      const formattedFromDate = `${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`;
      const formattedToDate = `${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`;
      
      const payload = {
        title,
        subtitle, 
        fromDate: formattedFromDate,
        toDate: formattedToDate,
        doctorName,
        image: imageUrl || 'https://cdn-icons-png.flaticon.com/512/3063/3063206.png',
        active: isActive
      };

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
        Alert.alert('Success', 'Push Message updated successfully!');
      } else {
        await axios.post(API_URL, payload);
        Alert.alert('Success', 'Push Message created successfully!');
      }
      
      // Reset form
      setTitle('');
      setSubtitle('');
      setFromDate(new Date());
      setToDate(new Date());
      setImageUrl('');
      setIsActive(true);
      setEditingId(null);
      
      setCreateModalVisible(false);
      fetchCamps();
    } catch (err) {
      Alert.alert('Error', 'Failed to save message');
      console.log(err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this camp?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/${id}`);
          fetchCamps();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete camp');
        }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBlueBackground} />
      <Header isBlueTheme={false} />
      
      <View style={styles.content}>
        
        {/* Header with Title and Add Button */}
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Push Messages:</Text>
          
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={openCreate}
          >
            <Icon name="plus" size={16} color="#FFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingBottom: 90 }}>
          {loading ? (
            <ActivityIndicator size="large" color="#0066FF" style={{ marginTop: 20 }} />
          ) : camps.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#666' }}>No camps found.</Text>
          ) : (
            <FlatList
              data={camps}
              keyExtractor={item => item.id || item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.campCard}>
                  <View style={styles.campCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image 
                        source={require('../../assets/images/push msg.png')} 
                        style={{ width: 18, height: 18, marginRight: 6, resizeMode: 'contain' }} 
                      />
                      <Text style={styles.campCardTitle}>{item.title}</Text>
                    </View>
                    <Text style={[styles.activeText, !item.active && { color: '#FF4C4C' }]}>
                      {item.active !== false ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  
                  <Text style={styles.campCardDesc}>{item.subtitle}</Text>
                  
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.campImage} />
                  )}

                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                      <Icon name="pencil" size={14} color="#666" style={{ marginRight: 4 }} />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id || item._id)}>
                      <Icon name="delete" size={14} color="#FF4C4C" style={{ marginRight: 4 }} />
                      <Text style={styles.actionTextDelete}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </View>

      {/* Create Modal Popup */}
      <Modal visible={createModalVisible} transparent animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Push Message' : 'Create Push Message'}</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} style={styles.closeBtn}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <View style={styles.activeStatusRow}>
                <Text style={styles.activeStatusText}>Active Status</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#767577', true: '#34C759' }}
                  thumbColor={isActive ? '#f4f3f4' : '#f4f3f4'}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Free Medical Camp"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>From Date</Text>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
                    <Text style={styles.dateText}>
                      {`${fromDate.getDate().toString().padStart(2, '0')}/${(fromDate.getMonth() + 1).toString().padStart(2, '0')}/${fromDate.getFullYear()}`}
                    </Text>
                  </TouchableOpacity>
                  {showFromPicker && (
                    <DateTimePicker
                      value={fromDate}
                      mode="date"
                      display="default"
                      onChange={(e, date) => {
                        setShowFromPicker(false);
                        if (date) setFromDate(date);
                      }}
                    />
                  )}
                </View>

                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>To Date</Text>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
                    <Text style={styles.dateText}>
                      {`${toDate.getDate().toString().padStart(2, '0')}/${(toDate.getMonth() + 1).toString().padStart(2, '0')}/${toDate.getFullYear()}`}
                    </Text>
                  </TouchableOpacity>
                  {showToPicker && (
                    <DateTimePicker
                      value={toDate}
                      mode="date"
                      display="default"
                      onChange={(e, date) => {
                        setShowToPicker(false);
                        if (date) setToDate(date);
                      }}
                    />
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={subtitle}
                  onChangeText={setSubtitle}
                  placeholder="Details..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={[styles.inputContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 0, marginTop: 10, paddingHorizontal: 5 }]}>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: '600', flex: 1 }}>Image Upload</Text>
                <TouchableOpacity style={[styles.uploadContainer, { flex: 1.2, paddingVertical: imageUrl ? 0 : 15, marginTop: 0, overflow: 'hidden' }]} onPress={handleImagePick}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 100, resizeMode: 'cover' }} />
                  ) : (
                    <>
                      <Icon name="image-outline" size={28} color="#0066FF" />
                      <Text style={{ color: '#999', fontSize: 9, marginVertical: 8, textAlign: 'center' }}>Click the button below to{'\n'}upload your files</Text>
                      <View style={[styles.chooseFileBtn, { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6 }]}>
                        <Text style={styles.chooseFileText}>Choose File</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={creating}>
                <Text style={styles.submitBtnText}>{creating ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  topBlueBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 180,
    backgroundColor: '#0066FF',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginHorizontal: 15,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  activeStatusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeStatusText: {
    marginRight: 10,
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    position: 'absolute',
    top: -10,
    left: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
    zIndex: 1,
    color: '#666',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  dateBtn: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
  },
  uploadContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#FAFAFA',
  },
  uploadHintText: {
    color: '#999',
    fontSize: 12,
    marginVertical: 10,
  },
  chooseFileBtn: {
    backgroundColor: '#0066FF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  chooseFileText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 40,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  campCard: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  campCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  campCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  activeText: {
    color: '#34C759',
    fontWeight: 'bold',
    fontSize: 12,
  },
  campCardDesc: {
    color: '#666',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  campImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginRight: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  actionText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },
  actionTextDelete: {
    color: '#FF4C4C',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066FF',
  },
  closeBtn: {
    padding: 5,
  }
});
