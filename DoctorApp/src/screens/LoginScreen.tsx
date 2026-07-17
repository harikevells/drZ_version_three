import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, Dimensions, ImageBackground } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// Replace with your local machine's IP address if testing on physical device,
// or use 10.0.2.2 for Android emulator
const API_URL = 'http://10.10.11.90:5000/api/auth/doctor/login';

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
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const response = await axios.post(API_URL, { email, password, fcmToken });
      
      // Store token and user data
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      await AsyncStorage.setItem('loginTimestamp', Date.now().toString());
      
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
    <ImageBackground 
      source={require('../../assets/images/Android Compact - 122 (1).png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

      {/* Form Area */}
      <View style={styles.formContainer}>
        {/* We keep the Logo and Title just in case the background doesn't have it.
            If the background image has it already, these can be hidden later. */}
        <View style={styles.logoWrapper}>
          <Image 
            source={require('../assets/DoctorlogoApp.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Welcome To DrZ</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>User Name:</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password:</Text>
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
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 40,
    justifyContent: 'center',
    paddingTop: height * 0.1,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F7F8FA',
    fontSize: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderRadius: 12,
    backgroundColor: '#F7F8FA',
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#5C7CFA', // Blue from Figma
    borderRadius: 25,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    width: '100%',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
