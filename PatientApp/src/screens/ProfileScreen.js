import React, { useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';

const ProfileScreen = () => {
  const { user, login } = useContext(AuthContext);
  const { texts } = useContext(LanguageContext);

  // Edit Mode Toggle
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State Fields
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
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
      setBloodGroup(user.blood_group || '');
      setEmergencyContact(user.emergency_contact || '');
      setStreet(user.street || '');
      setArea(user.area || '');
      setDistrict(user.district || '');
      setStateName(user.state || '');
      setProfileImage(user.profileImage ? { uri: user.profileImage } : null);
    }
  }, [user, isEditMode]);

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile / சுயவிவரம்</Text>
          {!isEditMode && (
            <TouchableOpacity onPress={() => setIsEditMode(true)} style={styles.editHeaderButton}>
              <Icon name="pencil" size={20} color="#1C3E55" />
              <Text style={styles.editHeaderText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Circular Profile Avatar Card */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              activeOpacity={isEditMode ? 0.7 : 1} 
              onPress={isEditMode ? handleImagePick : null}
              style={styles.avatarWrapper}
            >
              <Image source={getProfileImageSource()} style={styles.avatar} />
              {isEditMode && (
                <View style={styles.editIconBadge}>
                  <Icon name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.profileName}>{user?.patient_name || 'Patient Name'}</Text>
            <Text style={styles.profileId}>{user?.patient_id || 'PatXXXX'}</Text>
          </View>

          {/* Details / Edit form */}
          {!isEditMode ? (
            // VIEW MODE
            <View style={styles.detailsContainer}>
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <Icon name="account-details" size={22} color="#1C3E55" />
                  <Text style={styles.cardTitle}>Personal Info / தனிப்பட்ட விவரங்கள்</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="cellphone" size={20} color="#666" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Contact / தொடர்பு எண்</Text>
                    <Text style={styles.detailValue}>{user?.contactNumber || user?.identifier || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="calendar-range" size={20} color="#666" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Age / வயது</Text>
                    <Text style={styles.detailValue}>{user?.patient_age ? `${user.patient_age} years` : 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="water" size={20} color="#e63946" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Blood Group / இரத்த வகை</Text>
                    <Text style={styles.detailValue}>{user?.blood_group || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="phone-emergency" size={20} color="#e63946" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Emergency Contact / அவசர தொடர்பு எண்</Text>
                    <Text style={styles.detailValue}>{user?.emergency_contact || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <Icon name="map-marker-radius" size={22} color="#1C3E55" />
                  <Text style={styles.cardTitle}>Address / முகவரி</Text>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="road" size={20} color="#666" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Street / தெரு</Text>
                    <Text style={styles.detailValue}>{user?.street || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="home-city-outline" size={20} color="#666" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Area / பகுதி</Text>
                    <Text style={styles.detailValue}>{user?.area || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="city" size={20} color="#666" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>District / மாவட்டம்</Text>
                    <Text style={styles.detailValue}>{user?.district || 'N/A'}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Icon name="map" size={20} color="#666" style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>State / மாநிலம்</Text>
                    <Text style={styles.detailValue}>{user?.state || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // EDIT MODE
            <View style={styles.formContainer}>
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
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  editHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  editHeaderText: {
    fontSize: 13,
    color: '#1C3E55',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 25,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e9ecef',
    borderWidth: 3,
    borderColor: '#1C3E55',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    backgroundColor: '#1C3E55',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C3E55',
  },
  profileId: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 10,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C3E55',
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 24,
    textAlign: 'center',
  },
  detailTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  formContainer: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C3E55',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    color: '#555',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#333',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
    backgroundColor: '#1C3E55',
    marginLeft: 10,
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default ProfileScreen;
