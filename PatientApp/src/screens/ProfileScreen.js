import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ImageBackground, Linking, useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';


const ProfileScreen = ({ navigation }) => {
  const { user, login } = useContext(AuthContext);
  const { texts } = useContext(LanguageContext);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const formatDateString = (rawDate) => {
    if (!rawDate) return '';
    const d = new Date(rawDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  // Edit Mode Toggle
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State Fields
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [profileImage, setProfileImage] = useState(null); // stores picker object { uri, base64, etc. }

  // Sync state with user context on load/toggle
  useEffect(() => {
    if (user) {
      setPatientName(user.patient_name || '');
      setPatientAge(user.patient_age ? String(user.patient_age) : '');
      setGender(user.gender || 'Male');
      if (user.dob) {
        try {
          const parts = user.dob.split('/');
          if (parts.length === 3) {
            setDob(new Date(`${parts[2]}-${parts[1]}-${parts[0]}`));
          } else {
            setDob(new Date(user.dob));
          }
        } catch (e) {
          setDob(null);
        }
      } else {
        setDob(null);
      }
      setBloodGroup(user.blood_group || '');
      setEmergencyContact(user.emergency_contact || '');
      setStreet(user.street || '');
      setArea(user.area || '');
      setDistrict(user.district || '');
      setStateName(user.state || '');
      setProfileImage(user.profileImage ? { uri: user.profileImage } : null);
    }
  }, [user, isEditMode]);

  // Booking Counts States
  const [totalBookings, setTotalBookings] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [cancelledBookings, setCancelledBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);

  useEffect(() => {
    const fetchBookingCounts = async () => {
      try {
        const mobile = user?.contactNumber || user?.mobile;
        if (!mobile) return;
        console.log("[ProfileScreen] Fetching booking counts for:", mobile);
        const response = await axios.get(`${API_BASE_URL}/api/emails/patient-appointments/${mobile}`);
        if (response.data && Array.isArray(response.data)) {
          const list = response.data;
          setTotalBookings(list.length);

          let completed = 0;
          let cancelled = 0;
          let pending = 0;
          list.forEach(app => {
            const status = (app.status || '').toLowerCase();
            if (status === 'completed') {
              completed++;
            } else if (status === 'cancelled') {
              cancelled++;
            } else {
              pending++;
            }
          });
          setCompletedBookings(completed);
          setCancelledBookings(cancelled);
          setPendingBookings(pending);
        }
      } catch (error) {
        console.error("[ProfileScreen] Error fetching booking counts:", error);
      }
    };

    if (user) {
      fetchBookingCounts();
    }
  }, [user]);

  const handleImagePick = async () => {
    try {
      console.log("[ProfileScreen] Launching image picker...");
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      if (result.didCancel) {
        console.log("[ProfileScreen] Image picker cancelled");
        return;
      }
      if (result.errorCode) {
        Alert.alert("Picker Error / பிழை", result.errorMessage || result.errorCode);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0]);
      }
    } catch (error) {
      console.error("ImagePicker Error:", error);
      Alert.alert("Error / பிழை", "Failed to select image.");
    }
  };

  const handleSave = async () => {
    if (!patientName.trim()) {
      Alert.alert("Error / பிழை", "Please enter your name / பெயரை உள்ளிடவும்");
      return;
    }

    setLoading(true);

    try {
      let base64Image = '';
      if (profileImage) {
        // If it's a new picked image with base64 data, convert it
        if (profileImage.base64) {
          base64Image = `data:${profileImage.type};base64,${profileImage.base64}`;
        } else {
          // If it was already in context as a URL/base64, keep it
          base64Image = profileImage.uri;
        }
      }

      const payload = {
        patient_name: patientName,
        patient_age: patientAge ? Number(patientAge) : '',
        gender,
        dob: dob ? formatDateString(dob) : '',
        blood_group: bloodGroup,
        emergency_contact: emergencyContact,
        street,
        area,
        district,
        state: stateName,
        profileImage: base64Image
      };

      console.log("[ProfileScreen] Sending update payload...");
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/patient/update`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        }
      );

      if (response.data && response.data.user) {
        // Merge token back since backend response might exclude token
        const updatedUser = {
          ...response.data.user,
          contactNumber: user.contactNumber,
          token: user.token
        };
        await login(updatedUser);
        Alert.alert("Success / வெற்றி", "Profile updated successfully / சுயவிவரம் புதுப்பிக்கப்பட்டது");
        setIsEditMode(false);
      } else {
        Alert.alert("Error / பிழை", "Failed to update profile / புதுப்பித்தல் தோல்வியடைந்தது");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const msg = error.response?.data?.error || "Connection error / இணைப்புப் பிழை";
      Alert.alert("Error / பிழை", msg);
    } finally {
      setLoading(false);
    }
  };

  const getProfileImageSource = () => {
    if (profileImage && profileImage.uri) {
      return { uri: profileImage.uri };
    }
    return require('../assets/user.png');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Curved medical-themed backdrop header */}
          <ImageBackground
            source={require('../assets/profilebg.png')}
            style={styles.imageHeaderBg}
            imageStyle={styles.imageHeaderStyle}
          >
            {/* Header overlay for readability */}
            <View style={styles.headerDarkOverlay} />

            {/* Actions Bar (Back & Edit Profile button on the right) */}
            <View style={styles.headerActionRow}>
              <View style={styles.headerActionLeft}>
                <TouchableOpacity onPress={() => navigation && navigation.goBack()} style={styles.backArrowBtn}>
                  <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Profile / சுயவிவரம்</Text>
              </View>
            </View>

            {/* Profile Avatar and Name Block */}
            <View style={styles.headerProfileRow}>
              <View style={styles.avatarContainerOuter}>
                <TouchableOpacity
                  activeOpacity={isEditMode ? 0.7 : 1}
                  onPress={isEditMode ? handleImagePick : null}
                  style={styles.avatarWrapper}
                >
                  <Image source={getProfileImageSource()} style={styles.avatar} />
                  <View style={styles.cameraIconBadge}>
                    <Icon name="camera" size={13} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.headerProfileTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.profileNameText} numberOfLines={1}>{patientName || 'Patient Name'}</Text>
                  <Icon name="check-decagram" size={18} color="#5F76FE" style={{ marginLeft: 6 }} />
                </View>
                <View style={styles.patientIdBadge}>
                  <Text style={styles.patientIdText}>{user?.patient_id || 'PatXXXX'}</Text>
                </View>
                {!isEditMode && (
                  <TouchableOpacity onPress={() => setIsEditMode(true)} style={styles.editProfileSubRow}>
                    <Icon name="pencil" size={12} color="#FFF" />
                    <Text style={styles.editProfileSubText}>Edit Profile</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ImageBackground>

          {/* Details / Edit form */}
          {!isEditMode ? (
            // VIEW MODE
            <View style={styles.detailsContainer}>
              {/* Booking Overview Header */}
              <View style={styles.bookingOverviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="chart-bar" size={20} color="#1E3A8A" style={{ marginRight: 8 }} />
                  <Text style={styles.bookingOverviewTitle}>Booking Overview</Text>
                </View>
                <TouchableOpacity style={styles.dropdownSelector}>
                  <Text style={styles.dropdownSelectorText}>This Month</Text>
                  <Icon name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {/* Booking Stats Grid */}
              {isTablet ? (
                /* Tablet layout: 1 row with 4 boxes */
                <View style={styles.bookingStatsRowTablet}>
                  {/* Total Booking */}
                  <ImageBackground
                    source={require('../assets/totalappointmentbg.png')}
                    style={styles.statBoxBg}
                    imageStyle={styles.statBoxBgImage}
                  >
                    <View>
                      <Text style={styles.statBoxLabel}>Total Booking</Text>
                      <Text style={styles.statBoxCount}>{totalBookings}</Text>
                    </View>
                    <View style={styles.statBoxBottomRow}>
                      <Text style={styles.statBoxSubtitle}>All Appointments</Text>
                      <View style={styles.statBoxArrowBtnWhite}>
                        <Icon name="arrow-right" size={10} color="#2563EB" />
                      </View>
                    </View>
                  </ImageBackground>

                  {/* Completed */}
                  <ImageBackground
                    source={require('../assets/completebg.png')}
                    style={styles.statBoxBg}
                    imageStyle={styles.statBoxBgImage}
                  >
                    <View>
                      <Text style={styles.statBoxLabel}>Completed</Text>
                      <Text style={styles.statBoxCount}>{completedBookings}</Text>
                    </View>
                    <View style={styles.statBoxBottomRow}>
                      <Text style={styles.statBoxSubtitle}>Successful</Text>
                      <View style={styles.statBoxArrowBtnWhite}>
                        <Icon name="arrow-right" size={10} color="#059669" />
                      </View>
                    </View>
                  </ImageBackground>

                  {/* Pending */}
                  <ImageBackground
                    source={require('../assets/pendingbg.png')}
                    style={styles.statBoxBg}
                    imageStyle={styles.statBoxBgImage}
                  >
                    <View>
                      <Text style={styles.statBoxLabel}>Pending</Text>
                      <Text style={styles.statBoxCount}>{pendingBookings}</Text>
                    </View>
                    <View style={styles.statBoxBottomRow}>
                      <Text style={styles.statBoxSubtitle}>Yet to Visit</Text>
                      <View style={styles.statBoxArrowBtnWhite}>
                        <Icon name="arrow-right" size={10} color="#D97706" />
                      </View>
                    </View>
                  </ImageBackground>

                  {/* Cancelled */}
                  <ImageBackground
                    source={require('../assets/cancelbg.png')}
                    style={styles.statBoxBg}
                    imageStyle={styles.statBoxBgImage}
                  >
                    <View>
                      <Text style={styles.statBoxLabel}>Cancelled</Text>
                      <Text style={styles.statBoxCount}>{cancelledBookings}</Text>
                    </View>
                    <View style={styles.statBoxBottomRow}>
                      <Text style={styles.statBoxSubtitle}>Cancelled</Text>
                      <View style={styles.statBoxArrowBtnWhite}>
                        <Icon name="arrow-right" size={10} color="#DC2626" />
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              ) : (
                /* Mobile layout: 2 rows with 2 boxes each */
                <View style={styles.bookingStatsContainerMobile}>
                  {/* Row 1 */}
                  <View style={styles.bookingStatsRowMobile}>
                    {/* Total Booking */}
                    <ImageBackground
                      source={require('../assets/totalappointmentbg.png')}
                      style={styles.statBoxBg}
                      imageStyle={styles.statBoxBgImage}
                    >
                      <View>
                        <Text style={styles.statBoxLabel}>Total Booking</Text>
                        <Text style={styles.statBoxCount}>{totalBookings}</Text>
                      </View>
                      <View style={styles.statBoxBottomRow}>
                        <Text style={styles.statBoxSubtitle}>All Appointments</Text>
                        <View style={styles.statBoxArrowBtnWhite}>
                          <Icon name="arrow-right" size={10} color="#2563EB" />
                        </View>
                      </View>
                    </ImageBackground>

                    {/* Completed */}
                    <ImageBackground
                      source={require('../assets/completebg.png')}
                      style={styles.statBoxBg}
                      imageStyle={styles.statBoxBgImage}
                    >
                      <View>
                        <Text style={styles.statBoxLabel}>Completed</Text>
                        <Text style={styles.statBoxCount}>{completedBookings}</Text>
                      </View>
                      <View style={styles.statBoxBottomRow}>
                        <Text style={styles.statBoxSubtitle}>Successful</Text>
                        <View style={styles.statBoxArrowBtnWhite}>
                          <Icon name="arrow-right" size={10} color="#059669" />
                        </View>
                      </View>
                    </ImageBackground>
                  </View>

                  {/* Row 2 */}
                  <View style={[styles.bookingStatsRowMobile, { marginTop: 10 }]}>
                    {/* Pending */}
                    <ImageBackground
                      source={require('../assets/pendingbg.png')}
                      style={styles.statBoxBg}
                      imageStyle={styles.statBoxBgImage}
                    >
                      <View>
                        <Text style={styles.statBoxLabel}>Pending</Text>
                        <Text style={styles.statBoxCount}>{pendingBookings}</Text>
                      </View>
                      <View style={styles.statBoxBottomRow}>
                        <Text style={styles.statBoxSubtitle}>Yet to Visit</Text>
                        <View style={styles.statBoxArrowBtnWhite}>
                          <Icon name="arrow-right" size={10} color="#D97706" />
                        </View>
                      </View>
                    </ImageBackground>

                    {/* Cancelled */}
                    <ImageBackground
                      source={require('../assets/cancelbg.png')}
                      style={styles.statBoxBg}
                      imageStyle={styles.statBoxBgImage}
                    >
                      <View>
                        <Text style={styles.statBoxLabel}>Cancelled</Text>
                        <Text style={styles.statBoxCount}>{cancelledBookings}</Text>
                      </View>
                      <View style={styles.statBoxBottomRow}>
                        <Text style={styles.statBoxSubtitle}>Cancelled</Text>
                        <View style={styles.statBoxArrowBtnWhite}>
                          <Icon name="arrow-right" size={10} color="#DC2626" />
                        </View>
                      </View>
                    </ImageBackground>
                  </View>
                </View>
              )}

              {/* Personal Information Card */}
              <View style={styles.personalInfoMainCard}>
                <View style={styles.personalInfoMainCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.personalInfoBlueCircle}>
                      <Icon name="account" size={18} color="#FFF" />
                    </View>
                    <Text style={styles.personalInfoMainCardTitle}>
                      Personal Information / தனிப்பட்ட விவரங்கள்
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGridContainer}>
                  {/* Row 1 */}
                  <View style={styles.infoGridRow}>
                    {/* Contact Number */}
                    <View style={styles.infoGridCard}>
                      <View style={[styles.infoGridIconBg, { backgroundColor: '#EFF6FF' }]}>
                        <Icon name="phone" size={18} color="#5F76FE" />
                      </View>
                      <View style={styles.infoGridTextCol}>
                        <Text style={styles.infoGridLabel}>Contact Number</Text>
                        <Text style={styles.infoGridValue} numberOfLines={1}>
                          {user?.contactNumber || user?.identifier || '9080840247'}
                        </Text>
                      </View>
                    </View>

                    {/* Date of Birth */}
                    <View style={styles.infoGridCard}>
                      <View style={[styles.infoGridIconBg, { backgroundColor: '#F5F3FF' }]}>
                        <Icon name="calendar-blank" size={18} color="#5F76FE" />
                      </View>
                      <View style={styles.infoGridTextCol}>
                        <Text style={styles.infoGridLabel}>Date of Birth</Text>
                        <Text style={styles.infoGridValue} numberOfLines={1}>
                          {user?.dob || '23/10/2002'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Row 2 */}
                  <View style={[styles.infoGridRow, { marginTop: 12 }]}>
                    {/* Age */}
                    <View style={styles.infoGridCard}>
                      <View style={[styles.infoGridIconBg, { backgroundColor: '#ECFDF5' }]}>
                        <Icon name="account-outline" size={18} color="#10B981" />
                      </View>
                      <View style={styles.infoGridTextCol}>
                        <Text style={styles.infoGridLabel}>Age</Text>
                        <Text style={styles.infoGridValue} numberOfLines={1}>
                          {user?.patient_age ? `${user.patient_age} Years` : '23 Years'}
                        </Text>
                      </View>
                    </View>

                    {/* Blood Group */}
                    <View style={styles.infoGridCard}>
                      <View style={[styles.infoGridIconBg, { backgroundColor: '#FEF2F2' }]}>
                        <Icon name="water" size={18} color="#EF4444" />
                      </View>
                      <View style={styles.infoGridTextCol}>
                        <Text style={styles.infoGridLabel}>Blood Group</Text>
                        <Text style={styles.infoGridValue} numberOfLines={1}>
                          {user?.blood_group || 'O+'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Row 3 */}
                  <View style={[styles.infoGridRow, { marginTop: 12 }]}>
                    {/* Gender */}
                    <View style={styles.infoGridCard}>
                      <View style={[styles.infoGridIconBg, { backgroundColor: '#EFF6FF' }]}>
                        <Icon name="gender-male-female" size={18} color="#3B82F6" />
                      </View>
                      <View style={styles.infoGridTextCol}>
                        <Text style={styles.infoGridLabel}>Gender</Text>
                        <Text style={styles.infoGridValue} numberOfLines={1}>
                          {user?.gender || 'Male'}
                        </Text>
                      </View>
                    </View>

                    {/* Emergency Contact */}
                    <View style={styles.infoGridCard}>
                      <View style={[styles.infoGridIconBg, { backgroundColor: '#FFFBEB' }]}>
                        <Icon name="phone-incoming" size={18} color="#F59E0B" />
                      </View>
                      <View style={styles.infoGridTextCol}>
                        <Text style={styles.infoGridLabel}>Emergency Contact</Text>
                        <Text style={styles.infoGridValue} numberOfLines={1}>
                          {user?.emergency_contact || '8085258965'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Address Header */}
              <View style={styles.addressSectionHeaderRow}>
                <View style={styles.addressSectionHeaderIconContainer}>
                  <Icon name="map-marker" size={18} color="#FFF" />
                </View>
                <Text style={styles.addressSectionTitleText}>Address / முகவரி</Text>
              </View>

              {/* Address Card */}
              <ImageBackground
                source={require('../assets/profilemap.png')}
                style={styles.fullAddressCard}
                imageStyle={styles.fullAddressCardImage}
              >
                <View style={styles.fullAddressOverlay} />
                <View style={styles.fullAddressContent}>
                  <Text style={styles.addressLabel}>Home Address</Text>
                  <Text style={styles.addressValue} numberOfLines={1}>
                    {user?.street || 'TNHB Colony'}
                  </Text>
                  <Text style={styles.addressSubValue} numberOfLines={2}>
                    {user?.area ? `${user.area}, ` : ''}
                    {user?.district ? `${user.district}` : 'Madurai'}
                    {user?.state ? `, ${user.state}` : ', Tamil Nadu'}
                    {user?.pincode ? ` - ${user.pincode}` : ' - 625014'}
                  </Text>

                  <TouchableOpacity
                    style={styles.mapLargeButton}
                    onPress={() => {
                      const addressQuery = encodeURIComponent(`${user?.street || ''} ${user?.area || ''} ${user?.district || ''} ${user?.state || ''}`);
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addressQuery}`);
                    }}
                  >
                    <Text style={styles.mapLargeButtonText}>View on Map</Text>
                    <Icon name="map-legend" size={14} color="#FFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
              </ImageBackground>

              {/* Emergency Banner at the very bottom */}
              <View style={styles.emergencyBanner}>
                <View style={styles.emergencyAmbulanceCircle}>
                  <Image
                    source={require('../assets/ambulance_vector.png')}
                    style={styles.emergencyAmbulanceImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.emergencyTextCol}>
                  <Text style={styles.emergencyTitle}>Emergency / அவசரம்</Text>
                  <Text style={styles.emergencySubtitle}>Call your guardian immediately</Text>
                  <Text style={styles.emergencyPhone}>{user?.emergency_contact || '8085258965'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.emergencyCallBtn}
                  onPress={() => {
                    const phone = user?.emergency_contact || '8085258965';
                    Linking.openURL(Platform.OS === 'android' ? `tel:${phone}` : `telprompt:${phone}`);
                  }}
                >
                  <Icon name="phone" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={styles.emergencyCallBtnText}>Call Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // EDIT MODE
            <View style={styles.formContainer}>
              <View style={styles.formCard}>
                <Text style={styles.sectionHeader}>Edit Details / விவரங்களைத் திருத்தவும்</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name / பெயர்</Text>
                  <TextInput
                    value={patientName}
                    onChangeText={setPatientName}
                    style={styles.textInput}
                    placeholder="Enter Name"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Age / வயது</Text>
                    <TextInput
                      value={patientAge}
                      onChangeText={setPatientAge}
                      keyboardType="numeric"
                      style={styles.textInput}
                      placeholder="Age"
                      placeholderTextColor="#888"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Blood Group / இரத்தம்</Text>
                    <TextInput
                      value={bloodGroup}
                      onChangeText={setBloodGroup}
                      style={styles.textInput}
                      placeholder="e.g. O+, A-"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>

                {/* Gender Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Gender / பாலினம்</Text>
                  <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    iconStyle={styles.iconStyle}
                    itemTextStyle={{ color: 'black' }}
                    data={[
                      { label: 'Male / ஆண்', value: 'Male' },
                      { label: 'Female / பெண்', value: 'Female' },
                      { label: 'Other / மற்றவை', value: 'Other' }
                    ]}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Gender"
                    value={gender}
                    onChange={item => setGender(item.value)}
                  />
                </View>

                {/* Date of Birth Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date of Birth / பிறந்த தேதி</Text>
                  <TouchableOpacity
                    style={styles.dobContainer}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dobText, !dob && { color: '#888' }]}>
                      {dob ? formatDateString(dob) : 'Select Date of Birth'}
                    </Text>
                    <Icon name="calendar-month" size={24} color="#888" style={styles.calendarIcon} />
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={dob || new Date()}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setDob(selectedDate);
                      }
                    }}
                  />
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Emergency Contact / அவசர தொடர்பு எண்</Text>
                  <TextInput
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    keyboardType="phone-pad"
                    style={styles.textInput}
                    placeholder="Emergency phone number"
                    placeholderTextColor="#888"
                  />
                </View>

                <Text style={[styles.sectionHeader, { marginTop: 15 }]}>Address / முகவரி</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Street / தெரு</Text>
                  <TextInput
                    value={street}
                    onChangeText={setStreet}
                    style={styles.textInput}
                    placeholder="Street details"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Area / பகுதி</Text>
                  <TextInput
                    value={area}
                    onChangeText={setArea}
                    style={styles.textInput}
                    placeholder="Area"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>District / மாவட்டம்</Text>
                    <TextInput
                      value={district}
                      onChangeText={setDistrict}
                      style={styles.textInput}
                      placeholder="District"
                      placeholderTextColor="#888"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>State / மாநிலம்</Text>
                    <TextInput
                      value={stateName}
                      onChangeText={setStateName}
                      style={styles.textInput}
                      placeholder="State"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>

                {/* Action buttons */}
                <View style={styles.actionButtonContainer}>
                  <TouchableOpacity
                    disabled={loading}
                    onPress={() => setIsEditMode(false)}
                    style={[styles.btn, styles.btnCancel]}
                  >
                    <Text style={styles.btnCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={loading}
                    onPress={handleSave}
                    style={[styles.btn, styles.btnSave]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.btnSaveText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    marginBottom: 85,
  },
  scrollContainer: {
    paddingBottom: 15,
  },
  imageHeaderBg: {
    height: 240,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 25 : 15,
    justifyContent: 'space-between',
    paddingBottom: 35,
    overflow: 'hidden',
  },
  imageHeaderStyle: {
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 41, 59, 0.25)',
  },
  headerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    marginTop: 5,
    paddingBottom: 15,
  },
  avatarContainerOuter: {
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 48,
    padding: 2,
    marginRight: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#5F76FE',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  headerProfileTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  patientIdBadge: {
    // backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    color: '#5F76FE',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  patientIdText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  editProfileSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5F76FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
  },
  editProfileSubText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  bookingOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingOverviewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownSelectorText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: 'bold',
  },
  bookingStatsRowTablet: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  bookingStatsContainerMobile: {
    marginBottom: 20,
  },
  bookingStatsRowMobile: {
    flexDirection: 'row',
    gap: 10,
  },
  statBoxBg: {
    flex: 1,
    height: 110,
    borderRadius: 20,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  statBoxBgImage: {
    borderRadius: 20,
  },
  statBoxLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statBoxCount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 7,
    marginLeft: 6
  },
  statBoxBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statBoxSubtitle: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '600',
  },
  statBoxArrowBtnWhite: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  personalInfoMainCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    marginBottom: 16,
  },
  personalInfoMainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personalInfoBlueCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5F76FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  personalInfoMainCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E1B4B',
  },
  infoGridContainer: {
    marginTop: 16,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoGridCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  infoGridIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  infoGridTextCol: {
    flex: 1,
  },
  infoGridLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  infoGridValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: 'bold',
    marginTop: 2,
  },
  addressSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  addressSectionHeaderIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5F76FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addressSectionTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E1B4B',
  },
  fullAddressCard: {
    width: '100%',
    height: 155,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  fullAddressCardImage: {
    borderRadius: 20,
  },
  fullAddressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  fullAddressContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 5,
  },
  addressLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  addressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 4,
  },
  addressSubValue: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  mapLargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5F76FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mapLargeButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickAccessSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  quickAccessScrollView: {
    paddingBottom: 20,
    gap: 10,
  },
  quickAccessItemCard: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  quickAccessIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  quickAccessTextCol: {
    flex: 1,
  },
  quickAccessName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  quickAccessSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 1,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7272',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
    marginTop: 10,
  },
  emergencyAmbulanceCircle: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  emergencyAmbulanceImage: {
    width: 38,
    height: 32,
  },
  emergencyTextCol: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  emergencySubtitle: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  emergencyPhone: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  emergencyCallBtnText: {
    color: '#FF7272',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C3E55',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: Platform.OS === 'ios' ? 42 : 38,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#888',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  dobText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  calendarIcon: {
    marginLeft: 10,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#f1f3f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  btnCancelText: {
    color: '#495057',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnSave: {
    backgroundColor: '#0D9488',
    marginLeft: 10,
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default ProfileScreen;
