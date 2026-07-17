import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking, ImageBackground, Dimensions
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
      <ScrollView contentContainerStyle={styles.scrollContainer} bounces={false} showsVerticalScrollIndicator={false}>

        <ImageBackground 
          source={require('../assets/Group 1707481559.png')} 
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
        >
          <TouchableOpacity onPress={handleLogoClick} style={{ alignItems: 'center' }}>
            <Image source={require('../assets/logo.png')} style={styles.drzLogo} resizeMode="contain" />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.formContainer}>
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
            placeholder="Enter Email or Number"
            placeholderTextColor="#888"
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
                Confirm Password / கடவுச்சொல் உறுதி
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
              color={rememberMe ? "#5A75F6" : "#888"}
            />
            <Text style={styles.checkboxText}>
              Remember Me / என்னை நினைவில் கொள்ளவும்
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color="#5A75F6" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleAuth}>
              <Text style={styles.buttonText}>
                {isLogin ? 'Login / உள்நுழைவு' : 'Register / பதிவு செய்யவும்'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.toggleAuthContainer}>
            <Text style={styles.toggleAuthText}>
              {isLogin ? "Don't have an account? / கணக்கு இல்லையா? " : "Already have an account? / கணக்கு உள்ளதா? "}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: '#fff', paddingBottom: 40 },
  headerBackground: { width: '100%', height: 280, justifyContent: 'center', alignItems: 'center' },
  headerBackgroundImage: { resizeMode: 'stretch' },
  drzLogo: { width: 180, height: 180, marginTop: 20 },
  formContainer: { paddingHorizontal: 30, paddingTop: 20, alignItems: 'center', flex: 1 },
  loginTitleContainer: { marginBottom: 25 },
  loginTitle: { fontSize: 20, fontWeight: '900', color: '#222', textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 12, fontWeight: 'bold', color: '#555', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F5F6F8', borderRadius: 8, padding: 14, fontSize: 14, color: '#000', borderWidth: 0 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F8', borderRadius: 8 },
  passwordInput: { flex: 1, padding: 14, fontSize: 14, color: '#000' },
  eyeIcon: { padding: 10, paddingRight: 14 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
  checkboxText: { marginLeft: 8, fontSize: 12, color: '#555', fontWeight: 'bold' },
  button: { backgroundColor: '#6276F5', paddingVertical: 14, borderRadius: 10, alignItems: 'center', elevation: 0, marginTop: 25 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' },
  toggleAuthContainer: { flexDirection: 'column', alignItems: 'center', marginTop: 25, gap: 5 },
  toggleAuthText: { fontSize: 12, color: '#666', textAlign: 'center' },
  toggleAuthLink: { fontSize: 13, color: '#6276F5', fontWeight: 'bold' },
  ambulanceButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E74C3C', alignItems: 'center', justifyContent: 'center', elevation: 5, marginBottom: 8 },
  ambulanceText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 12 }
});

export default LoginScreen;
