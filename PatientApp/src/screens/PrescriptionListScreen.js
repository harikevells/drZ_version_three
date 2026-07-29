import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { generatePrescriptionPDF } from '../utils/pdfGenerator';
import { API_BASE_URL } from '../config';

const formatTimeSlot = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  if (str.toLowerCase().includes('to') || str.includes('-')) return str;

  const match = str.match(/(\d+)[:.](\d+)\s*(am|pm)/i);
  if (!match) return str;

  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = match[3].toLowerCase();

  let hrs24 = hrs;
  if (ampm === 'pm' && hrs24 < 12) hrs24 += 12;
  if (ampm === 'am' && hrs24 === 12) hrs24 = 0;

  let eMins = mins;
  let eHrs = hrs24 + 1;
  if (eHrs >= 24) { eHrs -= 24; }

  const eAmpm = eHrs >= 12 ? 'pm' : 'am';
  let dHrs = eHrs % 12;
  if (dHrs === 0) dHrs = 12;

  const eMinsStr = eMins < 10 ? '0' + eMins : eMins;
  return `${str} - ${dHrs}.${eMinsStr} ${eAmpm.toUpperCase()}`;
};

const getMedicineQuantity = (medName, timingStr, daysStr) => {
  const name = String(medName || '').toLowerCase();
  const timing = String(timingStr || '');
  const days = parseInt(daysStr, 10) || 1;

  if (name.includes('gel') || name.includes('cream') || name.includes('ointment') || name.includes('paste') || name.includes('spray')) {
    return { value: '1', unit: 'Tube' };
  }
  if (name.includes('drop') || name.includes('syrup') || name.includes('suspension')) {
    return { value: '1', unit: 'Bottle' };
  }
  
  // Calculate tablet count
  let timesPerDay = 0;
  const lowerTiming = timing.toLowerCase();
  if (lowerTiming.includes('morning')) timesPerDay++;
  if (lowerTiming.includes('afternoon')) timesPerDay++;
  if (lowerTiming.includes('evening')) timesPerDay++;
  if (lowerTiming.includes('night') || lowerTiming.includes('bedtime') || lowerTiming.includes('nighttime')) timesPerDay++;
  
  if (timesPerDay === 0) timesPerDay = 1; // fallback
  
  const totalQty = days * timesPerDay;
  return { value: String(totalQty), unit: totalQty === 1 ? 'Tablet' : 'Tablets' };
};

const PrescriptionListScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

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
      outputRange: ['#FFFFFF', '#F3E5F5'] // Default white to light purple
    });
    
    const animatedBorderColor = blinkAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#EAEAEA', '#8E44AD'] // Light grey to dark purple
    });

    return (
      <Animated.View style={[
        styles.card,
        isBlinking ? { 
          backgroundColor: animatedBgColor, 
          borderColor: animatedBorderColor, 
          borderWidth: 2 
        } : null
      ]}>
        <TouchableOpacity activeOpacity={1} onPress={() => handleStopBlink(item.fullAppId)}>
          {/* Header Row: Doctor Info & Completed Status */}
          <View style={styles.cardHeader}>
            <View style={styles.doctorInfo}>
              <Image source={require('../assets/doctorlogo.png')} style={styles.doctorImg} />
              <View>
                <Text style={styles.prescribedByLabel}>Prescribed By</Text>
                <Text style={styles.doctorNameText}>{item.doctorName}</Text>
                <Text style={styles.doctorDegreeText}>MBBS MD</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.completedBadge}>
                <Icon name="check-circle" size={14} color="#16A34A" />
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
              <View style={styles.bookingIdContainer}>
                <Text style={styles.bookingIdLabel}>Booking ID</Text>
                <Text style={styles.bookingIdVal}>{item.appId}</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerLine} />

          {/* Middle Row: Appointment Date & Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeCol}>
              <View style={styles.iconCircle}>
                <Icon name="calendar-month-outline" size={18} color="#5F76FE" />
              </View>
              <View style={styles.dateTimeTextCol}>
                <Text style={styles.dateTimeLabel}>Appointment Date</Text>
                <Text style={styles.dateTimeVal}>{item.appointmentDate}</Text>
              </View>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.dateTimeCol}>
              <View style={styles.iconCircle}>
                <Icon name="clock-outline" size={18} color="#5F76FE" />
              </View>
              <View style={styles.dateTimeTextCol}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeVal}>{formatTimeSlot(item.appointmentTime)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerLine} />

          {/* Medicines Title */}
          <View style={styles.medicinesTitleRow}>
            <Icon name="file-document-outline" size={18} color="#5F76FE" />
            <Text style={styles.medicinesTitleText}>Medicines ({item.medicines.length})</Text>
          </View>

          {/* Medicines List */}
          <View style={item.medicines.length > 1 ? { maxHeight: 130, marginBottom: 8 } : { marginBottom: 8 }}>
            <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
              {item.medicines.map((med, index) => {
                const isEven = index % 2 === 0;
                const itemBg = isEven ? '#F8F9FD' : '#F6FCF7';
                const iconBg = isEven ? '#EAEFFE' : '#E8F5E9';
                const pillColor = isEven ? '#5F76FE' : '#16A34A';
                
                const lowerName = String(med.name || med.medicineName || '').toLowerCase();
                const isGel = lowerName.includes('gel') || lowerName.includes('cream') || lowerName.includes('ointment') || lowerName.includes('paste') || lowerName.includes('spray');
                const pillIcon = isGel ? 'lotion' : 'pill';

                const qtyInfo = getMedicineQuantity(med.name || med.medicineName, med.timing, med.days);
                const qtyText = `${qtyInfo.value} Qty`;

                return (
                  <View key={index} style={[styles.medCard, { backgroundColor: itemBg }]}>
                    <View style={styles.medCardHeader}>
                      {/* Left Side: Icon & Pill Badge */}
                      <View style={styles.medLeftCol}>
                        <View style={[styles.medIconBox, { backgroundColor: '#FFF' }]}>
                          <Icon name={pillIcon} size={28} color={pillColor} />
                        </View>
                        <View style={[styles.medBadge, { backgroundColor: iconBg }]}>
                          <Text style={[styles.medBadgeText, { color: pillColor }]}>{qtyText}</Text>
                        </View>
                      </View>

                      {/* Right Side: Info & 3-Column Grid */}
                      <View style={styles.medHeaderInfo}>
                        <Text style={styles.medNameText}>{med.name || med.medicineName || 'N/A'}</Text>
                        
                        {/* 3-Columns Grid */}
                        <View style={styles.medGrid}>
                          {/* Column 1: Timing */}
                          <View style={styles.gridCol}>
                            <View style={styles.gridHeaderRow}>
                              <Icon name="clock-outline" size={14} color="#5F76FE" />
                              <Text style={styles.gridLabel}>Timing</Text>
                            </View>
                            <Text style={[styles.gridValText, { color: '#5F76FE' }]}>{med.timing || 'N/A'}</Text>
                          </View>

                          {/* Column 2: Intake */}
                          <View style={styles.gridCol}>
                            <View style={styles.gridHeaderRow}>
                              <Icon name="silverware-fork-knife" size={14} color="#16A34A" />
                              <Text style={styles.gridLabel}>Intake</Text>
                            </View>
                            <Text style={[styles.gridValText, { color: '#333' }]}>{med.intake || 'N/A'}</Text>
                          </View>

                          {/* Column 3: Duration */}
                          <View style={[styles.gridCol, { marginRight: 0 }]}>
                            <View style={styles.gridHeaderRow}>
                              <Icon name="calendar-range" size={14} color="#7C3AED" />
                              <Text style={styles.gridLabel}>Duration</Text>
                            </View>
                            <Text style={[styles.gridValText, { color: '#7C3AED' }]}>
                              {med.days ? (String(med.days).toLowerCase().includes('day') ? med.days : `${med.days} Days`) : 'N/A'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Action Button Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.downloadPdfBtn} onPress={() => generatePrescriptionPDF(item)}>
              <Icon name="download" size={18} color="#FFF" />
              <Text style={styles.downloadPdfBtnText}>Download PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewPrescriptionBtn} onPress={() => { setSelectedPrescription(item); setModalVisible(true); }}>
              <Icon name="eye-outline" size={18} color="#5F76FE" />
              <Text style={styles.viewPrescriptionBtnText}>View Prescription</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerActionLeft}>
          <TouchableOpacity onPress={() => navigation && navigation.goBack()} style={styles.backArrowBtn}>
            <Icon name="arrow-left" size={24} color="#1C3E55" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Prescription List / மருந்து</Text>
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIconContainer}>
                  <Icon name="clipboard-text-outline" size={26} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Prescription Details</Text>
                  {selectedPrescription && (
                    <Text style={styles.modalSubtitle}>Total Medicines : {selectedPrescription.medicines.length}</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedPrescription && (
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingBottom: 0 }}
                style={selectedPrescription.medicines.length > 3 ? { maxHeight: 345 } : null}
              >
                {/* Medicines List */}
                {selectedPrescription.medicines.map((med, idx) => {
                  const isEven = idx % 3 === 0;
                  const isOdd = idx % 3 === 1;
                  
                  // Color configurations matching the mockup
                  let cardBg = '#F0F4FF';
                  let cardBorder = '#DCE4FF';
                  let iconCircleBg = '#E0E8FF';
                  let themeColor = '#2563EB';
                  
                  if (isOdd) {
                    cardBg = '#F0FDF4';
                    cardBorder = '#DCFCE7';
                    iconCircleBg = '#E8F5E9';
                    themeColor = '#16A34A';
                  } else if (idx % 3 === 2) {
                    cardBg = '#FAF5FF';
                    cardBorder = '#F3E8FF';
                    iconCircleBg = '#F3E8FF';
                    themeColor = '#7C3AED';
                  }

                  const lowerName = String(med.name || med.medicineName || '').toLowerCase();
                  const isGel = lowerName.includes('gel') || lowerName.includes('cream') || lowerName.includes('ointment') || lowerName.includes('paste') || lowerName.includes('spray');
                  const pillIcon = isGel ? 'lotion' : 'pill';
                  const qtyInfo = getMedicineQuantity(med.name || med.medicineName, med.timing, med.days);

                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.modalMedCard, 
                        { backgroundColor: cardBg, borderColor: cardBorder },
                        idx === selectedPrescription.medicines.length - 1 ? { marginBottom: 0 } : null
                      ]}
                    >
                      {/* Left Column: Icon circle */}
                      <View style={[styles.modalMedIconCircle, { backgroundColor: iconCircleBg }]}>
                        <Icon name={pillIcon} size={24} color={themeColor} />
                      </View>

                      {/* Right Column: Info & Details */}
                      <View style={styles.modalMedInfoContainer}>
                        {/* Name and Index row */}
                        <View style={styles.modalMedHeaderRow}>
                          <Text style={styles.modalMedName}>{med.name || med.medicineName || 'N/A'}</Text>
                          <View style={[styles.modalMedIndexBadge, { backgroundColor: themeColor }]}>
                            <Text style={styles.modalMedIndexText}>{idx + 1}</Text>
                          </View>
                        </View>

                        {/* Details Container */}
                        <View style={styles.modalMedDetailsContainer}>
                          {/* Timing Row */}
                          <View style={styles.modalDetailRowFull}>
                            <Icon name="clock-outline" size={16} color="#2563EB" style={styles.modalDetailIcon} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.modalDetailLabel}>Timing</Text>
                              <Text style={styles.modalDetailValue}>{med.timing || 'N/A'}</Text>
                            </View>
                          </View>

                          {/* Duration & Intake Row */}
                          <View style={styles.modalDetailRowSplit}>
                            {/* Duration Column */}
                            <View style={styles.modalDetailItemHalf}>
                              <Icon name="calendar-range" size={16} color="#7C3AED" style={styles.modalDetailIcon} />
                              <View>
                                <Text style={styles.modalDetailLabel}>Duration</Text>
                                <Text style={styles.modalDetailValue}>
                                  {med.days ? (String(med.days).toLowerCase().includes('day') ? med.days : `${med.days} days`) : 'N/A'}
                                </Text>
                              </View>
                            </View>

                            {/* Intake Column */}
                            <View style={styles.modalDetailItemHalf}>
                              <Icon name="silverware-fork-knife" size={16} color="#16A34A" style={styles.modalDetailIcon} />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.modalDetailLabel}>Intake</Text>
                                <Text style={styles.modalDetailValue}>{med.intake || 'N/A'}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  headerActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backArrowBtn: {
    padding: 4,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 15,
    marginBottom: 20, // Leave space for floating bottom tab bar so cards don't show behind/below it
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  prescribedByLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  doctorNameText: {
    color: '#1C3E55',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doctorDegreeText: {
    color: '#5F76FE',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  bookingIdContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  bookingIdLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
  },
  bookingIdVal: {
    color: '#5F76FE',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 1,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#F2F2F2',
    marginVertical: 15,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTimeCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateTimeTextCol: {
    justifyContent: 'center',
  },
  dateTimeLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateTimeVal: {
    color: '#1C3E55',
    fontSize: 12,
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  medicinesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  medicinesTitleText: {
    color: '#1C3E55',
    fontSize: 13,
    fontWeight: 'bold',
  },
  medCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  medCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  medLeftCol: {
    alignItems: 'center',
    marginRight: 12,
  },
  medBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  medIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  medHeaderInfo: {
    flex: 1,
  },
  medNameText: {
    color: '#1C3E55',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  medGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
    marginRight: 4,
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  gridLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '500',
    marginLeft: 3,
  },
  gridValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridIcon: {
    marginRight: 3,
  },
  gridValText: {
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  downloadPdfBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5F76FE',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  downloadPdfBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewPrescriptionBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5F76FE',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewPrescriptionBtnText: {
    color: '#5F76FE',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMedCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  modalMedIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalMedInfoContainer: {
    flex: 1,
  },
  modalMedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalMedName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  modalMedIndexBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMedIndexText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalMedDetailsContainer: {
    gap: 4,
  },
  modalDetailRowFull: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  modalDetailRowSplit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalDetailItemHalf: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    width: '48%',
  },
  modalDetailIcon: {
    marginTop: 2,
  },
  modalDetailLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  modalDetailValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 1,
  }
});

export default PrescriptionListScreen;
