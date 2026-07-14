import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Linking, 
  ActivityIndicator,
  Modal,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios'; 
import { AuthContext } from '../context/AuthContext'; 
import { LanguageContext } from '../context/LanguageContext';

import { API_BASE_URL } from '../config';
const BASE_URL = API_BASE_URL;

const ReportScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { language, changeLanguage, texts } = useContext(LanguageContext);
  
  const [showLangModal, setShowLangModal] = useState(false);
  const [latestAppointment, setLatestAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch Data ---
  useEffect(() => {
    if (!user) {
        setLoading(false);
    } else {
        fetchLatestAppointment();
    }
  }, [user]);

  const fetchLatestAppointment = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/get-appointments`);
      if (response.data.success) {
        // Filter only this user's data
        const myData = response.data.data.filter(app => app.uhid === user?.uhid);
        
        // Sort to get the LATEST appointment (assuming new ones are added to end, or use date sorting)
        // Ideally sort by ID or Date. Here we grab the last one in the array.
        if (myData.length > 0) {
            setLatestAppointment(myData[myData.length - 1]);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Helper for Detail Rows ---
  const DetailRow = ({ label, value, isBold = false }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label} : </Text>
        <Text style={[styles.detailValue, isBold && {fontWeight: 'bold', color: '#1C3E55'}]}>
            {value || "N/A"}
        </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* === TOP HEADER === */}
      <View style={styles.header}>
          <View style={styles.userInfo}>
              <Image source={require('../assets/user.png')} style={styles.userImage} />
              <View style={styles.textContainer}>
                  <Text style={styles.greeting}>{texts?.greeting || 'Hi'} {user?.name || "Patient"},</Text>
                  <Text style={styles.subGreeting}>Latest Booking Details</Text>
              </View>
          </View>
          
          <TouchableOpacity style={styles.langButton} onPress={() => setShowLangModal(true)}>
              <Image 
                source={require('../assets/tamil.png')} 
                style={{ width: 24, height: 24, resizeMode: 'contain' }} 
              />
          </TouchableOpacity>
      </View>

      {/* === MAIN CONTENT === */}
      {loading ? <ActivityIndicator size="large" color="#FF4081" style={{marginTop: 50}} /> : (
        <ScrollView contentContainerStyle={styles.container}>
          
          {latestAppointment ? (
            <>
              {/* SECTION 1: BOOKING INFO */}
              <Text style={styles.mainHeading}>Booking Summary / முன்பதிவு விவரம் :</Text>

              <View style={styles.detailsCard}>
                 <DetailRow label="Doctor/மருத்துவர்" value={latestAppointment.doctor} isBold={true} />
                 <DetailRow label="Date/தேதி" value={latestAppointment.appointmentDate} />
                 <DetailRow label="Time/நேரம்" value={latestAppointment.appointmentTime} />
                 <DetailRow 
                    label="Visit Type/வருகை வகை" 
                    value={latestAppointment.visitType || (latestAppointment.patientType === 'In Home' ? 'Home Visit' : 'Hospital Visit')} 
                 />
                 <DetailRow 
                    label="Video Call/வீடியோ கால்" 
                    value={latestAppointment.videoCall ? "Yes/ஆம்" : "No/இல்லை"} 
                 />
                 <DetailRow label="Status/நிலை" value={latestAppointment.status || "Booked"} />
              </View>

              {/* SECTION 2: SELECTED LAB TESTS */}
              <View style={styles.reportSection}>
                 <Text style={styles.sectionTitle}>Selected Labs / தேர்ந்தெடுக்கப்பட்ட லேப்:</Text>
                 
                 {latestAppointment.labTests && latestAppointment.labTests.length > 0 ? (
                     latestAppointment.labTests.map((test, index) => (
                        <View key={`lab-${index}`} style={styles.itemRow}>
                            <Icon name="flask-outline" size={20} color="#E91E63" style={{marginRight: 10}} />
                            <Text style={styles.itemName}>
                                {test.testNameDisplay || test.testName || test.category || "Lab Test"}
                            </Text>
                        </View>
                     ))
                 ) : (
                     <Text style={styles.noData}>No Lab Tests Selected</Text>
                 )}
              </View>

              {/* SECTION 3: SELECTED SCANS */}
              <View style={styles.reportSection}>
                 <Text style={styles.sectionTitle}>Selected Scans / தேர்ந்தெடுக்கப்பட்ட ஸ்கேன்:</Text>
                 
                 {latestAppointment.scanTests && latestAppointment.scanTests.length > 0 ? (
                     latestAppointment.scanTests.map((test, index) => (
                        <View key={`scan-${index}`} style={styles.itemRow}>
                            <Icon name="radiology-box" size={20} color="#1C3E55" style={{marginRight: 10}} />
                            <Text style={styles.itemName}>
                                {test.scanNameDisplay || test.scanName || test.category || "Scan"}
                            </Text>
                        </View>
                     ))
                 ) : (
                     <Text style={styles.noData}>No Scans Selected</Text>
                 )}
              </View>
            </>
          ) : (
            <View style={{alignItems:'center', marginTop: 50}}>
                <Icon name="calendar-remove" size={60} color="#ccc" />
                <Text style={styles.noDataText}>No appointments found.</Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* === BOTTOM NAVBAR === */}
      

      {/* Language Modal */}
      <Modal
        visible={showLangModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLangModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangModal(false)}>
          <View style={styles.langModalContent}>
            <TouchableOpacity style={styles.langOption} onPress={() => { changeLanguage('en'); setShowLangModal(false); }}>
               <View style={[styles.radioOuter, language === 'en' && styles.radioActiveBorder]}>
                  {language === 'en' && <View style={styles.radioInner} />}
               </View>
               <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langOption, { marginTop: 15 }]} onPress={() => { changeLanguage('ta'); setShowLangModal(false); }}>
               <View style={[styles.radioOuter, language === 'ta' && styles.radioActiveBorder]}>
                  {language === 'ta' && <View style={styles.radioInner} />}
               </View>
               <Text style={[styles.langText, language === 'ta' && styles.langTextActive]}>Tamil</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 20, paddingBottom: 100 }, 
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, marginBottom: 5 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userImage: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#eee', marginRight: 12 },
  textContainer: { justifyContent: 'center' },
  greeting: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  subGreeting: { fontSize: 13, color: 'gray' },
  langButton: { backgroundColor: '#fff', padding: 8, borderRadius: 20, elevation: 3 },

  // Content
  mainHeading: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 15, marginTop: 10 },
  detailsCard: { 
    backgroundColor: '#F9F9F9', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 25, 
    borderWidth: 1, 
    borderColor: '#eee' 
  },
  detailRow: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#666', width: '40%' }, 
  detailValue: { fontSize: 13, color: '#333', flex: 1 }, 

  reportSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#E91E63', marginBottom: 10 },
  
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1
  },
  itemName: { fontSize: 14, color: '#444', fontWeight: '500' },
  
  noData: { fontSize: 13, color: '#999', fontStyle: 'italic', marginLeft: 5 },
  noDataText: { fontSize: 16, color: '#999', marginTop: 10 },

  // Navbar
  navbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', height: 70, position: 'absolute', bottom: 0, left: 0, right: 0, elevation: 10, paddingBottom: 5 },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 11, color: '#888', marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 70, paddingRight: 20 },
  langModalContent: { width: 180, backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 10 },
  langOption: { flexDirection: 'row', alignItems: 'center' },
  langText: { fontSize: 16, color: '#333', marginLeft: 10, fontWeight: '500' },
  langTextActive: { fontWeight: 'bold', color: '#000' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  radioActiveBorder: { borderColor: '#28a745' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#28a745' }
});

export default ReportScreen;