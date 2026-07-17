import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const loginTime = await AsyncStorage.getItem('loginTime');

      if (userData && loginTime) {
        const currentTime = new Date().getTime();
        const storedTime = parseInt(loginTime, 10);
        
        // 2 days in milliseconds: 2 * 24 * 60 * 60 * 1000 = 172800000
        const twoDays = 172800000;

        if (currentTime - storedTime < twoDays) {
          setUser(JSON.parse(userData));
        } else {
          // Expired after 2 days
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('loginTime');
        }
      }
    } catch (e) {
      console.log('Error checking login status', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (patientData) => {
    setUser(patientData);
    try {
      const currentTime = new Date().getTime().toString();
      await AsyncStorage.setItem('user', JSON.stringify(patientData));
      await AsyncStorage.setItem('loginTime', currentTime);
    } catch (e) {
      console.log('Error saving login data', e);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('loginTime');
    } catch (e) {
      console.log('Error removing login data', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};