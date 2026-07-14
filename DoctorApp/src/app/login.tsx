import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Replace with your local machine's IP address if testing on physical device,
// or use 10.0.2.2 for Android emulator
const API_URL = 'http://10.0.2.2:5000/api/auth/doctor/login';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      
      // For now, just show a success alert since tabs aren't built yet
      Alert.alert('Success', 'Logged in successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Blue Curved Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Login Form */}
      <View style={styles.formContainer}>
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
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#052A3F', // Dark blue from mockup
    height: '40%',
    width: '100%',
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.5,
    transform: [{ scaleX: 1.5 }], // Trick to make the curve gentler and wider
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoContainer: {
    transform: [{ scaleX: 0.66 }], // Counteract the parent scaling so the logo isn't stretched
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 80,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2CA01C', // Green from mockup
    borderRadius: 8,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    alignSelf: 'center',
    width: 150,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
