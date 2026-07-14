import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking, ImageBackground
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

import { API_BASE_URL } from '../config';
import { setupPushNotifications } from '../services/PushNotificationService';
const BASE_URL = API_BASE_URL;

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
      const payload = { identifier, password };
      
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

            {!isLogin && (
              <>
                <Text style={styles.label}>
                  Confirm Password / கடவுச்சொல் உறுதி
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
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
              <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); }} style={{ marginTop: 5 }}>
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
  ambulanceText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 12 }
});

export default LoginScreen;