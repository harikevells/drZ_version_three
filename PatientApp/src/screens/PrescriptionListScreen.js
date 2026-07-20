import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Animated
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { generatePrescriptionPDF } from '../utils/pdfGenerator';
import { API_BASE_URL } from '../config';

const PrescriptionListScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const blinkAnim = React.useRef(new Animated.Value(0)).current;
  const flatListRef = React.useRef(null);
  const [blinkingAppId, setBlinkingAppId] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setBlinkingAppId(null);
      blinkAnim.setValue(0);
      blinkAnim.stopAnimation();
      navigation.setParams({ blinkAppId: undefined, blinkMessage: undefined });
    }
  }, [isFocused]);

  useEffect(() => {
    console.log("Checking blink...", { 
      blinkAppId: route?.params?.blinkAppId, 
      prescriptionsCount: prescriptions.length 
    });

    if ((route?.params?.blinkAppId || route?.params?.blinkMessage) && prescriptions.length > 0) {
      const targetAppId = route?.params?.blinkAppId ? String(route.params.blinkAppId) : null;
      const msg = (route.params.blinkMessage || '').toLowerCase();

      console.log("Target App ID from Nav:", targetAppId);

      const matchedItems = prescriptions.map((app, index) => {
        // Strict match first
        if (targetAppId && (String(app.fullAppId) === targetAppId || String(app.booking_id) === targetAppId)) {
          return { index, score: 100 };
        }

        // Fallback scoring
        let score = 0;
        const docName = String(app.doctorName).toLowerCase();
        const appDate = String(app.appointmentDate).toLowerCase();
        
        if (docName && docName !== 'unknown doctor' && msg.includes(docName)) score += 2;
        if (appDate && appDate !== 'n/a' && msg.includes(appDate)) score += 2;

        return { index, score };
      }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score);

      const targetIndex = matchedItems.length > 0 ? matchedItems[0].index : -1;

      console.log("Found Target Index:", targetIndex, matchedItems);

      if (targetIndex !== -1) {
        console.log("Setting Blinking App ID to:", prescriptions[targetIndex].fullAppId);
        setBlinkingAppId(prescriptions[targetIndex].fullAppId);
        
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: targetIndex,
              animated: true,
              viewPosition: 0.5
            });
          }
        }, 500);

        // Blink 6 times (iterations: 6)
        Animated.loop(
          Animated.sequence([
            Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
            Animated.timing(blinkAnim, { toValue: 0, duration: 500, useNativeDriver: false })
          ]),
          { iterations: 6 }
        ).start(() => {
          setBlinkingAppId(null);
          blinkAnim.setValue(0);
        });

        navigation.setParams({ blinkAppId: undefined, blinkMessage: undefined });
      }
    }
  }, [route?.params?.blinkAppId, route?.params?.blinkMessage, prescriptions]);

  const handleStopBlink = (appId) => {
    if (blinkingAppId === appId) {
      setBlinkingAppId(null);
      blinkAnim.setValue(0);
      blinkAnim.stopAnimation();
    }
  };

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const mobile = user?.contactNumber || user?.mobile;
      if (!mobile) {
        setLoading(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/api/emails/patient-appointments/${mobile}`);

      if (response.data && Array.isArray(response.data)) {
        // Extract appointments that have prescriptions
        const validAppointments = response.data.filter(
          app => app.prescription && Array.isArray(app.prescription) && app.prescription.length > 0
        ).map(app => ({
          doctorName: app.doctor_name || app.doctor || 'Unknown Doctor',
          appId: app.booking_id || 'Appmt0000',
          fullAppId: String(app.booking_id || app._id || app.id || ''),
          appointmentDate: app.appointment_date || app.appointmentDate || 'N/A',
          appointmentTime: app.appointment_time || app.appointmentTime || 'N/A',
          patientName: app.patient_name || 'N/A',
          patientAge: app.patient_age || 'N/A',
          patientGender: app.patient_gender || app.gender || '-',
          treatmentCategory: app.treatment_category || 'N/A',
          medicines: app.prescription
        }));
        
        setPrescriptions(validAppointments);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderMedicineCard = ({ item }) => {
    const isBlinking = blinkingAppId === item.fullAppId;
    
    // Smooth color animation for background and border
    const animatedBgColor = blinkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#F8F9FA', '#F3E5F5'] // Default grey to light purple
    });
    
    const animatedBorderColor = blinkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', '#8E44AD'] // Transparent to dark purple
    });

    return (
      <TouchableOpacity activeOpacity={1} onPress={() => handleStopBlink(item.fullAppId)}>

        <Animated.View style={[
          styles.card,
          isBlinking ? { 
            backgroundColor: animatedBgColor, 
            borderColor: animatedBorderColor, 
            borderWidth: 2 
          } : null
        ]}>
        <View style={styles.cardHeader}>
          <Text style={styles.prescribedBy}>Prescribed By: {item.doctorName}</Text>
          <Text style={styles.appId}>Booking ID : {item.appId}</Text>
        </View>

        {item.medicines.map((med, index) => (
          <View key={index} style={{ marginBottom: 12 }}>
            <Text style={styles.medDetail}>Medicine Name: {med.name || med.medicineName || 'N/A'}</Text>
            <Text style={styles.medDetail}>Timing: {med.timing || 'N/A'}</Text>
            <Text style={styles.medDetail}>Intake : {med.intake || 'N/A'}</Text>
            <Text style={styles.medDetail}>Days : {med.days || 'N/A'}</Text>
            {index < item.medicines.length - 1 && (
              <View style={{ height: 1, backgroundColor: '#E0E0E0', marginTop: 8 }} />
            )}
          </View>
        ))}

        <Text style={styles.medDetail}>Appointment Date: {item.appointmentDate}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => generatePrescriptionPDF(item)}>
            <Icon name="download" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Icon name="share-variant" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
            <Icon name="arrow-left" size={24} color="#555" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription List/ மருந்து</Text>
        </View>
      </View>

      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#5F76FE" style={{ marginTop: 50 }} />
        ) : prescriptions.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={prescriptions}
            extraData={blinkingAppId}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderMedicineCard}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.5 });
              });
            }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="pill" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No prescriptions found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 10,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  dateFilterText: {
    fontSize: 12,
    color: '#555',
    marginRight: 5,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  prescribedBy: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  appId: {
    fontSize: 13,
    color: '#5F76FE',
    fontWeight: '600',
  },
  medDetail: {
    fontSize: 13,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 15,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5F76FE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 5,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
    fontWeight: '500'
  }
});

export default PrescriptionListScreen;
