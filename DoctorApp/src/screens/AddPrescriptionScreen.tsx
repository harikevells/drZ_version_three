import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropdown } from 'react-native-element-dropdown';

const API_BASE = 'http://10.10.11.90:5000/api';
const API_URL = `${API_BASE}/prescriptions`; 

export default function AddPrescriptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const initialPatientName = route.params?.patient?.patient_name || '';
  const initialPatientId = route.params?.patient?.id || route.params?.patient?._id || '';

  const [patientName, setPatientName] = useState(initialPatientName);
  const [patientId, setPatientId] = useState(initialPatientId);
  const [medicines, setMedicines] = useState([{ name: '', timing: '', intake: '' }]);
  const [loading, setLoading] = useState(false);
  const [doctorName, setDoctorName] = useState('');

  // Dropdown data states
  const [patientsList, setPatientsList] = useState<{label: string, value: string, id: string}[]>([]);
  const [medicineOptions, setMedicineOptions] = useState<{label: string, value: string}[]>([]);
  const [timingOptions, setTimingOptions] = useState<{label: string, value: string}[]>([]);
  const [intakeOptions, setIntakeOptions] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    const fetchDocNameAndData = async () => {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.doctorName) {
          setDoctorName(parsed.doctorName);
          fetchDropdownData(parsed.doctorName);
        }
      }
    };
    fetchDocNameAndData();
  }, []);

  const fetchDropdownData = async (docName: string) => {
    try {
      // 1. Fetch Patients
      const apptRes = await axios.get(`${API_BASE}/appointments/all/${encodeURIComponent(docName)}`);
      if (apptRes.data) {
        const uniqueMap = new Map();
        apptRes.data.forEach((appt: any) => {
          if (appt.patient_name && !uniqueMap.has(appt.patient_name)) {
            uniqueMap.set(appt.patient_name, {
              label: appt.patient_name,
              value: appt.patient_name,
              id: appt.id || appt._id
            });
          }
        });
        setPatientsList(Array.from(uniqueMap.values()));
      }

      // 2. Fetch Medicines
      const medRes = await axios.get(`${API_BASE}/medicines`);
      if (medRes.data) {
        setMedicineOptions(medRes.data.map((m: any) => ({ label: m.medicineName, value: m.medicineName })));
      }

      // 3. Fetch Timings
      const timingRes = await axios.get(`${API_BASE}/medicine-timings`);
      if (timingRes.data) {
        setTimingOptions(timingRes.data.map((t: any) => ({ label: t.title, value: t.title })));
      }

      // 4. Fetch Intakes
      const intakeRes = await axios.get(`${API_BASE}/medicine-intakes`);
      if (intakeRes.data) {
        setIntakeOptions(intakeRes.data.map((i: any) => ({ label: i.title, value: i.title })));
      }

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleAddMore = () => {
    setMedicines([...medicines, { name: '', timing: '', intake: '' }]);
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const newMeds = [...medicines];
    newMeds[index] = { ...newMeds[index], [field]: value };
    setMedicines(newMeds);
  };

  const handleSubmit = async () => {
    if (!patientName) {
      Alert.alert('Error', 'Please select a Patient Name');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(API_URL, {
        patientName,
        patientId,
        medicines,
        doctorName
      });
      
      setLoading(false);
      Alert.alert('Success', 'Prescription added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('MainTabs', { screen: 'Prescription' });
          }
        }
      ]);

    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert('Error', 'Failed to submit prescription.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blueBackground}>
        <Header isBlueTheme={true} />
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <Text style={styles.pageTitle}>Prescription:</Text>

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                inputSearchStyle={styles.inputSearchStyle}
                data={patientsList}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Patient Name"
                searchPlaceholder="Search..."
                value={patientName}
                onChange={item => {
                  setPatientName(item.value);
                  setPatientId(item.id);
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput 
                style={[styles.input, { backgroundColor: '#F0F0F0', color: '#888' }]}
                placeholder="Patient ID"
                placeholderTextColor="#999"
                value={patientId}
                editable={false}
              />
            </View>

            {medicines.map((med, index) => (
              <View key={index} style={styles.medicineBlock}>
                {medicines.length > 1 && (
                  <Text style={styles.medCounter}>Medicine #{index + 1}</Text>
                )}
                
                <View style={styles.inputGroup}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    data={medicineOptions}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Medicine Name"
                    searchPlaceholder="Search..."
                    value={med.name}
                    onChange={item => updateMedicine(index, 'name', item.value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={timingOptions}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Timing"
                    value={med.timing}
                    onChange={item => updateMedicine(index, 'timing', item.value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    data={intakeOptions}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Intake"
                    value={med.intake}
                    onChange={item => updateMedicine(index, 'intake', item.value)}
                  />
                </View>
              </View>
            ))}

            <View style={styles.submitContainer}>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.addButtonContainer} onPress={handleAddMore}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF',
  },
  blueBackground: {
    backgroundColor: '#0066FF',
    paddingBottom: 20,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    marginTop: 10,
  },
  formContainer: {
    marginTop: 5,
  },
  medicineBlock: {
    marginBottom: 10,
  },
  medCounter: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066FF',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
  },
  dropdown: {
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
  },
  submitContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#2CA01C',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButtonContainer: {
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  addButtonText: {
    color: '#0066FF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
