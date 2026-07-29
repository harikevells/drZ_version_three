import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import SearchableDropdown from '../components/SearchableDropdown';

interface Medicine {
  id: string;
  name: string;
  timing: string;
  intake: string;
  days: string;
}

export default function PrescriptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientName, patientId, appointmentId, displayAppointmentId, displayPatientId, existingPrescription } = route.params || {};

  const [pName, setPName] = useState(patientName || '');
  const [pId, setPId] = useState(displayPatientId || patientId || '');
  const [appmtId, setAppmtId] = useState(displayAppointmentId || appointmentId || '');
  const [medicineName, setMedicineName] = useState('');
  const [selectedTimings, setSelectedTimings] = useState<string[]>([]);
  const [timingSearch, setTimingSearch] = useState('');
  const [showTiming, setShowTiming] = useState(false);
  const [intake, setIntake] = useState('');
  const [days, setDays] = useState('');
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const [medicineOptions, setMedicineOptions] = useState<any[]>([]);
  const [timingOptions, setTimingOptions] = useState<any[]>([]);
  const [intakeOptions, setIntakeOptions] = useState<any[]>([]);

  useEffect(() => {
    if (patientName) setPName(patientName);
    if (displayPatientId || patientId) setPId(displayPatientId || patientId);
    if (displayAppointmentId || appointmentId) setAppmtId(displayAppointmentId || appointmentId);
    if (existingPrescription && Array.isArray(existingPrescription)) {
      setMedicines(existingPrescription);
    }
  }, [patientName, patientId, displayPatientId, appointmentId, displayAppointmentId, existingPrescription]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, timeRes, intakeRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/medicines`),
          axios.get(`${API_BASE_URL}/medicine-timings`),
          axios.get(`${API_BASE_URL}/medicine-intakes`),
        ]);
        setMedicineOptions(medRes.data.filter((m: any) => m.activeStatus !== false));
        setTimingOptions(timeRes.data.filter((t: any) => t.status !== 'Inactive'));
        setIntakeOptions(intakeRes.data.filter((i: any) => i.status !== 'Inactive'));
      } catch (error) {
        console.error('Error fetching dynamic data:', error);
      }
    };
    fetchData();
  }, []);

  const handleAddMedicine = () => {
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please select or enter a medicine name');
      return;
    }

    if (editingMedicineId) {
      setMedicines(medicines.map(m => m.id === editingMedicineId ? {
        ...m,
        name: medicineName,
        timing: selectedTimings.join(', '),
        intake: intake,
        days: days
      } : m));
      setEditingMedicineId(null);
    } else {
      const newMedicine: Medicine = {
        id: Date.now().toString(),
        name: medicineName,
        timing: selectedTimings.join(', '),
        intake: intake,
        days: days
      };
      setMedicines([...medicines, newMedicine]);
    }

    // Clear fields
    setMedicineName('');
    setSelectedTimings([]);
    setTimingSearch('');
    setShowTiming(false);
    setIntake('');
    setDays('');
  };

  const handleEditMedicine = (item: Medicine) => {
    setMedicineName(item.name);
    setSelectedTimings(item.timing ? item.timing.split(',').map(s => s.trim()).filter(Boolean) : []);
    setIntake(item.intake);
    setDays(item.days || '');
    setEditingMedicineId(item.id);
  };

  const removeMedicine = (id: string) => {
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine from the prescription?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMedicines(medicines.filter(m => m.id !== id));
            if (editingMedicineId === id) {
              setEditingMedicineId(null);
            }
          }
        }
      ]
    );
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

  // Helper function for mapping intake/title
  const getIntakeLabel = (item: any) => {
    return item.intake || item.title || '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.blueTopBackground} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription</Text>
      </View>

      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Appointment ID</Text>
              <TextInput
                style={styles.input}
                value={appmtId}
                onChangeText={setAppmtId}
                placeholder="Enter Appointment ID"
                editable={false}
              />
            </View>

            <View style={styles.separator} />

            <View style={[styles.inputGroup, { zIndex: 4 }]}>
              <Text style={styles.label}>Medicine Name</Text>
              <SearchableDropdown
                data={medicineOptions}
                value={medicineName}
                onChangeText={setMedicineName}
                placeholder="Select or type medicine"
                labelKey="medicineName"
              />
            </View>

            <View style={[styles.inputGroup, { zIndex: 3 }]}>
              <Text style={styles.label}>Timing</Text>
              <View style={styles.multiSelectContainer}>
                <View style={styles.tagsContainer}>
                  {selectedTimings.map(t => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t} </Text>
                      <TouchableOpacity onPress={() => setSelectedTimings(prev => prev.filter(x => x !== t))}>
                        <Ionicons name="close-circle" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TextInput
                    style={styles.multiInput}
                    value={timingSearch}
                    onChangeText={text => { setTimingSearch(text); setShowTiming(true); }}
                    onFocus={() => setShowTiming(true)}
                    placeholder={selectedTimings.length === 0 ? "e.g. Morning" : ""}
                    placeholderTextColor="#999"
                  />
                </View>
                <TouchableOpacity onPress={() => setShowTiming(!showTiming)} style={{ padding: 10 }}>
                  <Ionicons name={showTiming ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                </TouchableOpacity>
              </View>

              {showTiming && (
                <View style={[styles.timingDropdown, { maxHeight: 180 }]}>
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {timingOptions.filter(opt => opt.title.toLowerCase().includes(timingSearch.toLowerCase())).map((opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.timingOptionItem}
                        onPress={() => {
                          if (!selectedTimings.includes(opt.title)) {
                            setSelectedTimings([...selectedTimings, opt.title]);
                          }
                          setTimingSearch('');
                          setShowTiming(false);
                        }}
                      >
                        <Text style={styles.timingOptionText}>{opt.title}</Text>
                      </TouchableOpacity>
                    ))}
                    {timingOptions.filter(opt => opt.title.toLowerCase().includes(timingSearch.toLowerCase())).length === 0 && (
                      <View style={styles.timingOptionItem}>
                        <Text style={styles.timingOptionText}>No options found</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { zIndex: 2 }]}>
              <Text style={styles.label}>Intake</Text>
              <SearchableDropdown
                data={intakeOptions.map(i => ({ ...i, displayLabel: i.intake || i.title }))}
                value={intake}
                onChangeText={setIntake}
                placeholder="e.g. Before Food"
                labelKey="displayLabel"
              />
              <Text style={styles.intakeDesc}>
                {intakeOptions.find(i => (i.intake || i.title) === intake)?.description || "Specify how the medicine should be taken (e.g. Before/After Food)"}
              </Text>
            </View>

            <View style={[styles.inputGroup, { zIndex: 1 }]}>
              <Text style={styles.label}>Days</Text>
              <TextInput
                style={styles.input}
                value={days}
                onChangeText={setDays}
                placeholder="e.g. 5 Days"
              />
            </View>

            <TouchableOpacity style={styles.addBtnContainer} onPress={handleAddMedicine}>
              <Text style={styles.addBtnText}>{editingMedicineId ? 'Update' : '+ Add'}</Text>
            </TouchableOpacity>

            {medicines.length > 0 && (
              <View style={styles.medicinesList}>
                <Text style={styles.medicinesListTitle}>Added Medicines:</Text>
                {medicines.map((item, index) => (
                  <View key={item.id} style={styles.medicineItem}>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{index + 1}. {item.name}</Text>
                      <Text style={styles.medicineDetails}>Timing: {item.timing}</Text>
                      <Text style={styles.medicineDetails}>Intake: {item.intake}</Text>
                      {item.days ? <Text style={styles.medicineDetails}>Duration: {item.days}</Text> : null}
                    </View>
                    <View style={styles.actionIconsRow}>
                      <TouchableOpacity onPress={() => handleEditMedicine(item)} style={{ marginRight: 15 }}>
                        <Ionicons name="create-outline" size={20} color="#0D6EFD" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeMedicine(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#FF4C4C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  blueTopBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#0D6EFD',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  content: {
    position: 'absolute',
    top: 85,
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: '95%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: -10,
    left: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
    zIndex: 10,
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
  intakeDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
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
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  medicineInfo: {
    flex: 1,
    paddingRight: 15,
  },
  medicineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicineDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  multiSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    backgroundColor: '#FFF',
    minHeight: 45,
  },
  tagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginVertical: 4,
  },
  tagText: {
    fontSize: 13,
    color: '#333',
    marginRight: 4,
    paddingRight: 6,
    paddingBottom: 2,
    lineHeight: 18,
  },
  multiInput: {
    flex: 1,
    minWidth: 80,
    height: 40,
    padding: 0,
    paddingLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  timingDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
    overflow: 'hidden',
  },
  timingOptionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timingOptionText: {
    fontSize: 14,
    color: '#333',
  }
});

