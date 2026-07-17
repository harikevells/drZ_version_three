import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.10.11.90:5000/api/prescriptions';

export default function PrescriptionScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchPrescriptions();
    }
  }, [isFocused]);

  const fetchPrescriptions = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.doctorName) {
          const response = await axios.get(`${API_URL}/doctor/${encodeURIComponent(parsed.doctorName)}`);
          setPrescriptions(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Blue Top Background */}
      <View style={styles.blueBackground}>
        <Header isBlueTheme={true} />
      </View>

      {/* Main Content Card (White overlay) */}
      <View style={styles.contentWrapper}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Title and Actions */}
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Prescription List :</Text>
            
            <View style={styles.topActions}>
              <TouchableOpacity 
                style={styles.addButtonTop} 
                onPress={() => navigation.navigate('AddPrescription')}
              >
                <Text style={styles.addButtonTopText}>+ Add</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateBadge}>
                <Text style={styles.dateText}>02/08/2026</Text>
                <Ionicons name="calendar-outline" size={14} color="#666" style={{marginLeft: 5}} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Patient Name"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* List of Prescriptions */}
          {loading ? (
            <ActivityIndicator size="large" color="#0066FF" style={{marginTop: 50}} />
          ) : filteredPrescriptions.length === 0 ? (
            <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>No prescriptions found.</Text>
          ) : (
            filteredPrescriptions.map((item) => (
              <View key={item.id || item._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.patientIdText}>Patient Id : <Text style={styles.boldText}>{item.patientId}</Text></Text>
                  <Text style={styles.dateRangeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.detailText}><Text style={styles.detailLabel}>Patient Name: </Text>{item.patientName}</Text>
                  
                  {item.medicines && item.medicines.map((med: any, idx: number) => (
                    <View key={idx} style={{marginTop: 5, paddingLeft: 10, borderLeftWidth: 2, borderColor: '#0066FF'}}>
                      <Text style={styles.detailText}><Text style={styles.detailLabel}>Medicine Name: </Text>{med.name}</Text>
                      <Text style={styles.detailText}><Text style={styles.detailLabel}>Timing: </Text>{med.timing}</Text>
                      <Text style={styles.detailText}><Text style={styles.detailLabel}>Intake: </Text>{med.intake}</Text>
                    </View>
                  ))}
                  
                  <Text style={[styles.detailText, {marginTop: 10}]}><Text style={styles.detailLabel}>Prescribed By: </Text>{item.doctorName}</Text>
                </View>
              </View>
            ))
          )}

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
    paddingBottom: 100, // Space for bottom nav
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonTop: {
    backgroundColor: '#0066FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  addButtonTopText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  patientIdText: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: 'bold',
  },
  dateRangeText: {
    color: '#0066FF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginTop: 5,
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#000',
  }
});
