import React, { useEffect } from 'react';
import { View, StyleSheet, Image, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupPushNotifications } from '../services/PushNotificationService';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const checkLoginAndNavigate = async () => {
      try {
        const storedData = await AsyncStorage.getItem('userData');
        const token = await AsyncStorage.getItem('userToken');
        if (storedData && token) {
          setupPushNotifications(token, 'doctor');
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Failed to load user data during splash screen:', error);
        navigation.replace('Login');
      }
    };

    const timer = setTimeout(() => {
      checkLoginAndNavigate();
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <Image 
        source={require('../assets/Splashscreenbackgroundimage.png')} 
        style={styles.bgImage} 
        resizeMode="cover" 
      />
      <Image
        source={require('../assets/DoctorlogoApp.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  logo: {
    width: 280,
    height: 220,
  },
});
