import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// Replace with your local machine's IP address if testing on physical device,
// or use 10.0.2.2 for Android emulator
import { API_BASE_URL } from '../config';
import { setupPushNotifications } from '../services/PushNotificationService';
const API_URL = `${API_BASE_URL}/auth/doctor/login`;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both User Name and Password');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(API_URL, { email, password });
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      
      // Register FCM Token
      await setupPushNotifications(response.data.token, 'doctor');
      
      // Navigate directly to MainTabs
      navigation.replace('MainTabs');
    } catch (error: any) {
      console.log('Login Error:', error.message, error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Invalid credentials';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Image source={require('../assets/loginbackgroundimage.png')} style={styles.backgroundImage} resizeMode="cover" />

      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/DoctorlogoApp.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>

        <Text style={styles.welcomeText}>Welcome To DrZ</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>User Name</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 30,
  },
  logo: {
    width: 270,
    height: 170,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 5,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F7F7F7',
    fontSize: 15,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#000',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#6B7AFF',
    borderRadius: 30,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    alignSelf: 'center',
    width: 200,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
