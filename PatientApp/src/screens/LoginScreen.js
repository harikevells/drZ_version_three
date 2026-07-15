import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Important: Adjust IP address based on your setup (e.g., '10.0.2.2' for Android emulator, your WiFi IP for real device)
const IP_ADDRESS = '10.10.11.90';
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);

  // UI State
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

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

    if (!isLogin && password !== confirmPassword) {
      Alert.alert("Error / பிழை", "Passwords do not match / கடவுச்சொற்கள் பொருந்தவில்லை");
      return;
    }

    setLoading(true);

    try {
      if (rememberMe) {
        await AsyncStorage.setItem('savedIdentifier', identifier);
      } else {
        await AsyncStorage.removeItem('savedIdentifier');
      }

      const endpoint = isLogin ? '/api/auth/patient/login' : '/api/auth/patient/register';
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const payload = { identifier, password, fcmToken };
      
      const response = await axios.post(`${BASE_URL}${endpoint}`, payload);
      
      if (response.data) {
        if (!isLogin) {
          // Registration successful
          Alert.alert(
            "Success / வெற்றி",
            "Registration successful. Please login.\nபதிவு வெற்றிகரமாக முடிந்தது. தயவுசெய்து உள்நுழையவும்."
          );
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
        } else if (response.data.token) {
          // Save token or handle user session
          const userPayload = {
            ...response.data.user,
            contactNumber: identifier,
            token: response.data.token
          };
          login(userPayload);
        } else {
          Alert.alert("Error", "Authentication failed.");
        }
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={styles.container}>

        <TouchableOpacity onPress={handleLogoClick} style={{ alignItems: 'center', width: '100%' }}>
          <View style={styles.poweredByContainer}>
            <Image source={require('../assets/logo.png')} style={styles.drzLogo} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        <View style={styles.loginTitleContainer}>
          <Icon name={isLogin ? "login" : "account-plus"} size={28} color="#000" style={{ marginRight: 8 }} />
          <Text style={styles.loginTitle}>
            {isLogin ? 'Login / உள்நுழைய' : 'Register / பதிவு செய்ய'}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>
            Email or Mobile / மின்னஞ்சல் அல்லது எண் <Text style={styles.star}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Email or Number"
            placeholderTextColor="#888"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>
            Password / கடவுச்சொல் <Text style={styles.star}>*</Text>
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={securePassword}
            />
            <TouchableOpacity onPress={() => setSecurePassword(!securePassword)} style={styles.eyeIcon}>
              <Icon name={securePassword ? "eye-off-outline" : "eye-outline"} size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <>
              <Text style={styles.label}>
                Confirm Password / உறுதிப்படுத்துக <Text style={styles.star}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirmPassword}
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
              size={24}
              color={rememberMe ? "#1C4E63" : "#888"}
            />
            <Text style={styles.checkboxText}>
              Remember Me / நினைவில் கொள்க
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#1C4E63" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleAuth}>
              <Text style={styles.buttonText}>
                {isLogin ? 'Login / உள்நுழைய' : 'Register / பதிவு செய்ய'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.toggleAuthContainer}>
            <Text style={styles.toggleAuthText}>
              {isLogin ? "Don't have an account? / கணக்கு இல்லையா? " : "Already have an account? / ஏற்கனவே கணக்கு உள்ளதா? "}
            </Text>
            <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); }}>
              <Text style={styles.toggleAuthLink}>
                {isLogin ? "Register" : "Login"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <TouchableOpacity style={styles.ambulanceButton} onPress={handleAmbulance}>
              <Icon name="ambulance" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.ambulanceText}>
              Emergency / அவசர உதவி
            </Text>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 25, paddingTop: 50, paddingBottom: 40, alignItems: 'center' },
  poweredByContainer: { alignItems: 'center', marginTop: 5, marginBottom: 30 },
  drzLogo: { width: 100, height: 100 },
  loginTitleContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  form: { width: '100%' },
  label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 15 },
  star: { color: 'red' },
  input: { borderWidth: 1.5, borderColor: '#777', borderRadius: 8, padding: 14, fontSize: 16, backgroundColor: '#fff', color: '#000' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#777', borderRadius: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, padding: 14, fontSize: 16, color: '#000' },
  eyeIcon: { padding: 10, paddingRight: 14 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  checkboxText: { marginLeft: 8, fontSize: 13, fontWeight: 'bold', color: '#444' },
  button: { backgroundColor: '#1C4E63', paddingVertical: 15, borderRadius: 8, alignItems: 'center', elevation: 3, marginTop: 25, paddingHorizontal: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  toggleAuthContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
  toggleAuthText: { fontSize: 13, color: '#444', textAlign: 'center' },
  toggleAuthLink: { fontSize: 13, color: '#1C4E63', fontWeight: 'bold' },
  ambulanceButton: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: '#D32F2F', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, marginBottom: 5, borderWidth: 2, borderColor: '#fff' },
  ambulanceText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 }
});

export default LoginScreen;