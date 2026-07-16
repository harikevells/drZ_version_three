import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

interface Medicine {
  id: string;
  name: string;
  timing: string;
  intake: string;
}

export default function PrescriptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientName, patientId, appointmentId, existingPrescription } = route.params || {};

  const [pName, setPName] = useState(patientName || '');
  const [pId, setPId] = useState(patientId || '');
  const [medicineName, setMedicineName] = useState('');
  const [timing, setTiming] = useState('');
  const [intake, setIntake] = useState('');
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (patientName) setPName(patientName);
    if (patientId) setPId(patientId);
    if (existingPrescription && Array.isArray(existingPrescription)) {
      setMedicines(existingPrescription);
    }
  }, [patientName, patientId, existingPrescription]);

  const handleAddMedicine = () => {
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please enter a medicine name');
      return;
    }
    
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: medicineName,
      timing: timing,
      intake: intake
    };

    setMedicines([...medicines, newMedicine]);
    
    // Clear fields
    setMedicineName('');
    setTiming('');
    setIntake('');
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const handleSubmit = async () => {
    try {
      if (medicines.length === 0) {
        Alert.alert('Warning', 'No medicines added. Do you want to submit anyway?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: () => submitPrescription() }
        ]);
        return;
      }
      await submitPrescription();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit prescription');
    }
  };

  const submitPrescription = async () => {
    if (!appointmentId) {
      Alert.alert('Error', 'Appointment ID is missing.');
      return;
    }
    
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/appointments/${appointmentId}/prescription`, {
        prescription: medicines
      });
      
      setLoading(false);
      Alert.alert('Success', 'Prescription submitted successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs', { screen: 'Appointments' }) }
      ]);
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert('Error', 'Failed to submit prescription to the server.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Prescription:</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Name</Text>
            <TextInput
              style={styles.input}
              value={pName}
              onChangeText={setPName}
              placeholder="Enter Patient Name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient ID</Text>
            <TextInput
              style={styles.input}
              value={pId}
              onChangeText={setPId}
              placeholder="Enter Patient ID"
            />
          </View>

          <View style={styles.separator} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Medicine Name</Text>
            <TextInput
              style={styles.input}
              value={medicineName}
              onChangeText={setMedicineName}
              placeholder="e.g. Paracetamol"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Timing</Text>
            <TextInput
              style={styles.input}
              value={timing}
              onChangeText={setTiming}
              placeholder="e.g. 1-0-1 (Morning-Afternoon-Night)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Intake</Text>
            <TextInput
              style={styles.input}
              value={intake}
              onChangeText={setIntake}
              placeholder="e.g. After Food"
            />
          </View>

          <TouchableOpacity style={styles.addBtnContainer} onPress={handleAddMedicine}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>

          {medicines.length > 0 && (
            <View style={styles.medicinesList}>
              <Text style={styles.medicinesListTitle}>Added Medicines:</Text>
              {medicines.map((item, index) => (
                <View key={item.id} style={styles.medicineItem}>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{index + 1}. {item.name}</Text>
                    <Text style={styles.medicineDetails}>{item.timing} | {item.intake}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeMedicine(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF4C4C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D6EFD', // Matches the blue header background in other screens
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#0D6EFD',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    position: 'absolute',
    top: -10,
    left: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
    zIndex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 15,
  },
  addBtnContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  addBtnText: {
    color: '#0D6EFD',
    fontWeight: 'bold',
    fontSize: 14,
  },
  medicinesList: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    padding: 15,
  },
  medicinesListTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  medicineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  medicineDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#2CD95C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
