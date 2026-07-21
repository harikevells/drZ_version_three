import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking, ImageBackground
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';


import { API_BASE_URL } from '../config';
import { setupPushNotifications } from '../services/PushNotificationService';
const BASE_URL = API_BASE_URL;

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);

  const formatDateString = (rawDate) => {
    if (!rawDate) return '';
    const d = new Date(rawDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };


  // UI State
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  // New Profile Registration Fields State
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
  const [profileImage, setProfileImage] = useState(null);


  const handleImageUpload = async () => {
    try {
      console.log("[Frontend handleImageUpload] Launching image library...");
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      console.log("[Frontend handleImageUpload] Result keys:", Object.keys(result));
      if (result.didCancel) {
        console.log("[Frontend handleImageUpload] User cancelled image picker");
        return;
      }
      if (result.errorCode) {
        console.log("[Frontend handleImageUpload] Error code:", result.errorCode, "Message:", result.errorMessage);
        Alert.alert("Picker Error", `Error: ${result.errorMessage || result.errorCode}`);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        console.log("[Frontend handleImageUpload] Asset uri:", result.assets[0].uri);
        console.log("[Frontend handleImageUpload] Asset base64 exists:", !!result.assets[0].base64);
        setProfileImage(result.assets[0]);
      } else {
        console.log("[Frontend handleImageUpload] No assets found in result");
      }
    } catch (error) {
      console.error("ImagePicker Error: ", error);
      Alert.alert("Upload Error", "Image picker failed.");
    }
  };

  // LOAD SAVED CREDENTIALS
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedIdentifier = await AsyncStorage.getItem('savedIdentifier');
        if (savedIdentifier) {
          setIdentifier(savedIdentifier);
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Failed to load credentials", error);
      }
    };
    loadCredentials();
  }, []);

  const handleAuth = async () => {
    if (!identifier) {
      Alert.alert("Error / பிழை", "Please enter email or mobile number / மின்னஞ்சல் அல்லது மொபைல் எண்ணை உள்ளிடவும்");
      return;
    }
    if (!password) {
      Alert.alert("Error / பிழை", "Please enter password / கடவுச்சொல்லை உள்ளிடவும்");
      return;
    }

    if (!isLogin) {
      if (!patientName) {
        Alert.alert("Error / பிழை", "Please enter your name / பெயரை உள்ளிடவும்");
        return;
      }
      if (!gender) {
        Alert.alert("Error / பிழை", "Please select gender / பாலினத்தைத் தேர்ந்தெடுக்கவும்");
        return;
      }
      if (!dob) {
        Alert.alert("Error / பிழை", "Please select Date of Birth / பிறந்த தேதியைத் தேர்ந்தெடுக்கவும்");
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert("Error / பிழை", "Passwords do not match / கடவுச்சொற்கள் பொருந்தவில்லை");
        return;
      }
    }

    setLoading(true);

    try {
      if (rememberMe) {
        await AsyncStorage.setItem('savedIdentifier', identifier);
      } else {
        await AsyncStorage.removeItem('savedIdentifier');
      }

      const endpoint = isLogin ? '/api/auth/patient/login' : '/api/auth/patient/register';
      let payload = { identifier, password };

      if (!isLogin) {
        let base64Image = '';
        if (profileImage) {
          base64Image = profileImage.base64 ? `data:${profileImage.type};base64,${profileImage.base64}` : profileImage.uri;
        }
        payload = {
          ...payload,
          patient_name: patientName,
          patient_age: patientAge,
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
      }
      console.log("[Frontend handleAuth] Sending payload keys:", Object.keys(payload));
      console.log("[Frontend handleAuth] profileImage present:", !!payload.profileImage);
      if (payload.profileImage) {
        console.log("[Frontend handleAuth] profileImage length:", payload.profileImage.length);
        console.log("[Frontend handleAuth] profileImage snippet:", payload.profileImage.substring(0, 100));
      }
      
      const response = await axios.post(`${BASE_URL}${endpoint}`, payload);
      
      if (response.data && response.data.token) {
        // Save token or handle user session
        const userPayload = {
          ...response.data.user,
          contactNumber: identifier,
          token: response.data.token
        };
        
        // Register FCM Token
        setupPushNotifications(response.data.token, 'patient');
        
        login(userPayload);
      } else {
        Alert.alert("Error", "Authentication failed.");
      }
    } catch (error) {
      console.error("Auth error", error);
      const errMsg = error.response?.data?.error || "Network error. Please check your connection.";
      Alert.alert("Error / பிழை", errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    const phoneNumber = '9876543210';
    let url = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  const handleAmbulance = () => {
    const phoneNumber = '801';
    Linking.openURL(`tel:${phoneNumber}`).catch(err =>
      Alert.alert('Error', 'Unable to open dialer')
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={styles.container} bounces={false}>

        <TouchableOpacity onPress={handleLogoClick} style={{ width: '100%' }}>
          <ImageBackground source={require('../assets/logobackgroundimage.png')} style={styles.drzLogoBg} resizeMode="stretch">
            <Image source={require('../assets/logo.png')} style={styles.drzLogo} resizeMode="contain" />
          </ImageBackground>
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.loginTitleContainer}>
            <Text style={styles.loginTitle}>
              {isLogin ? 'Login / உள்நுழைவு' : 'Register / பதிவு செய்யவும்'}
            </Text>
          </View>

          <View style={styles.form}>
            {isLogin ? (
              <>
                <Text style={styles.label}>
                  Email Or Mobile / மின்னஞ்சல் அல்லது கைபேசி
                </Text>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.label}>
                  Password / கடவுச்சொல்
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={securePassword}
                  />
                  <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
                    <Icon name={securePassword ? "eye-off-outline" : "eye-outline"} size={24} color="#888" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* 1. Profile Image Pick */}
                <View style={{ alignItems: 'center', marginBottom: 15 }}>
                  <TouchableOpacity onPress={handleImageUpload} style={styles.imagePickerButton}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Icon name="camera-plus" size={30} color="#fff" />
                        <Text style={styles.imagePlaceholderText}>Upload Image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 2. Register Name */}
                <Text style={styles.label}>
                  Register Name / பெயர்
                </Text>
                <TextInput
                  style={styles.input}
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="Enter Name"
                  placeholderTextColor="#999"
                />

                {/* 3. Email Or Mobile */}
                <Text style={styles.label}>
                  Email Or Mobile / மின்னஞ்சல் அல்லது கைபேசி
                </Text>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter Email or Mobile"
                  placeholderTextColor="#999"
                />

                {/* 4. Age */}
                <Text style={styles.label}>
                  Age / வயது
                </Text>
                <TextInput
                  style={styles.input}
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                  placeholder="Enter Age"
                  placeholderTextColor="#999"
                />

                {/* Gender Dropdown */}
                <Text style={styles.label}>
                  Gender / பாலினம்
                </Text>
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
                  placeholder="Select Gender / பாலினத்தைத் தேர்ந்தெடுக்கவும்"
                  value={gender}
                  onChange={item => setGender(item.value)}
                />

                {/* Date of Birth Picker */}
                <Text style={styles.label}>
                  Date of Birth / பிறந்த தேதி
                </Text>
                <TouchableOpacity 
                  style={styles.dobContainer} 
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dobText, !dob && { color: '#999' }]}>
                    {dob ? formatDateString(dob) : 'Select Date of Birth'}
                  </Text>
                  <Icon name="calendar-month" size={24} color="#888" style={styles.calendarIcon} />
                </TouchableOpacity>

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


                {/* 5. Blood Group */}
                <Text style={styles.label}>
                  Blood Group / இரத்த வகை
                </Text>
                <TextInput
                  style={styles.input}
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                  placeholder="Enter Blood Group"
                  placeholderTextColor="#999"
                />

                {/* 6. Emergency Contact */}
                <Text style={styles.label}>
                  Emergency Contact / அவசர தொடர்பு எண்
                </Text>
                <TextInput
                  style={styles.input}
                  value={emergencyContact}
                  onChangeText={setEmergencyContact}
                  keyboardType="phone-pad"
                  placeholder="Enter Emergency Contact"
                  placeholderTextColor="#999"
                />

                {/* 7. Address - Street */}
                <Text style={styles.label}>
                  Street / தெரு
                </Text>
                <TextInput
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Enter Street"
                  placeholderTextColor="#999"
                />

                {/* 8. Address - Area */}
                <Text style={styles.label}>
                  Area / பகுதி
                </Text>
                <TextInput
                  style={styles.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Enter Area"
                  placeholderTextColor="#999"
                />

                {/* 9. Address - District */}
                <Text style={styles.label}>
                  District / மாவட்டம்
                </Text>
                <TextInput
                  style={styles.input}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="Enter District"
                  placeholderTextColor="#999"
                />

                {/* 10. Address - State */}
                <Text style={styles.label}>
                  State / மாநிலம்
                </Text>
                <TextInput
                  style={styles.input}
                  value={stateName}
                  onChangeText={setStateName}
                  placeholder="Enter State"
                  placeholderTextColor="#999"
                />

                {/* 11. Password */}
                <Text style={styles.label}>
                  Password / கடவுச்சொல்
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={securePassword}
                    placeholder="Enter Password"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
                    <Icon name={securePassword ? "eye-off-outline" : "eye-outline"} size={24} color="#888" />
                  </TouchableOpacity>
                </View>

                {/* 12. Confirm Password */}
                <Text style={styles.label}>
                  Confirm Password / கடவுச்சொல் உறுதி
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={secureConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity onPress={() => setSecureConfirmPassword(!secureConfirmPassword)} style={styles.eyeIcon}>
                    <Icon name={secureConfirmPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#888" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <Icon
                name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"}
                size={22}
                color={rememberMe ? "#5C74FF" : "#888"}
              />
              <Text style={styles.checkboxText}>
                Remember Me / என்னை நினைவில் கொள்ளவும்
              </Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color="#5C74FF" style={{ marginTop: 10 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <Text style={styles.buttonText}>
                  {isLogin ? 'Login / உள்நுழையவும்' : 'Register / பதிவு செய்யவும்'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.toggleAuthContainer}>
              <Text style={styles.toggleAuthText}>
                {isLogin ? "Don't have an account? / கணக்கு இல்லையா?" : "Already have an account? / கணக்கு உள்ளதா?"}
              </Text>
              <TouchableOpacity onPress={() => {
                setIsLogin(!isLogin);
                setPassword('');
                setConfirmPassword('');
                setPatientName('');
                setPatientAge('');
                setBloodGroup('');
                setEmergencyContact('');
                setStreet('');
                setArea('');
                setDistrict('');
                setStateName('');
                setProfileImage(null);
                setGender('Male');
                setDob(null);
              }} style={{ marginTop: 5 }}>
                <Text style={styles.toggleAuthLink}>
                  {isLogin ? "Register" : "Login"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginTop: 30 }}>
              <TouchableOpacity style={styles.ambulanceButton} onPress={handleAmbulance}>
                <Icon name="ambulance" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.ambulanceText}>
                Emergency / அவசர உதவி
              </Text>
            </View>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 20, alignItems: 'center' },
  drzLogoBg: { width: '100%', height: 300, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 },
  drzLogo: { width: 270, height: 190, marginTop: 20 },
  contentContainer: { width: '100%', paddingHorizontal: 25, marginTop: 10 },
  loginTitleContainer: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  loginTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { borderRadius: 8, padding: 14, fontSize: 15, backgroundColor: '#F5F5F5', color: '#000' },
  dropdown: { borderRadius: 8, paddingHorizontal: 14, height: 50, backgroundColor: '#F5F5F5' },
  placeholderStyle: { fontSize: 15, color: '#999' },
  selectedTextStyle: { fontSize: 15, color: '#000' },
  iconStyle: { width: 20, height: 20 },
  dobContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, padding: 14, backgroundColor: '#F5F5F5' },
  dobText: { fontSize: 15, color: '#000' },
  calendarIcon: { paddingLeft: 10 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, backgroundColor: '#F5F5F5' },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: '#000' },
  eyeIcon: { padding: 10, paddingRight: 14 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 0 },
  checkboxText: { marginLeft: 8, fontSize: 12, fontWeight: 'bold', color: '#555' },
  button: { backgroundColor: '#5C74FF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 25, paddingHorizontal: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  toggleAuthContainer: { flexDirection: 'column', alignItems: 'center', marginTop: 25 },
  toggleAuthText: { fontSize: 12, color: '#666', textAlign: 'center', width:'100%' },
  toggleAuthLink: { fontSize: 13, color: '#5C74FF', fontWeight: 'bold' },
  ambulanceButton: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, marginBottom: 5 },
  ambulanceText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5C74FF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginTop: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
  },
});

export default LoginScreen;