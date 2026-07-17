import React, { useEffect } from 'react';
import { StyleSheet, ImageBackground, Image, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const loginTimestamp = await AsyncStorage.getItem('loginTimestamp');
        
        let shouldLogin = true;

        if (userToken && loginTimestamp) {
          const currentTime = Date.now();
          const loginTime = parseInt(loginTimestamp, 10);
          const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

          if (currentTime - loginTime < twoDaysInMs) {
            shouldLogin = false;
          } else {
            // Token expired, clear storage
            await AsyncStorage.multiRemove(['userToken', 'userData', 'loginTimestamp']);
          }
        }

        setTimeout(() => {
          if (shouldLogin) {
            navigation.replace('Login');
          } else {
            navigation.replace('MainTabs');
          }
        }, 2000);

      } catch (error) {
        console.error('Error checking login status:', error);
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <ImageBackground 
      source={require('../../assets/images/Android Compact - 122.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/DoctorlogoApp.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 160,
  }
});
