import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

  interface HeaderProps {
  title?: string;
  isNotification?: boolean;
  isBlueTheme?: boolean;
}

export default function Header({ title, isNotification = false, isBlueTheme = false }: HeaderProps) {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [doctorName, setDoctorName] = useState('Dr.Johnny');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get Doctor Name
    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.doctorName) {
            setDoctorName(parsed.doctorName);
            fetchUnreadCount(parsed.doctorName);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (isFocused && doctorName !== 'Doctor') {
      fetchUnreadCount(doctorName);
    }
  }, [isFocused, doctorName]);

  const fetchUnreadCount = async (name: string) => {
    try {
      const response = await axios.get(`http://10.10.11.90:5000/api/notifications/doctor/${name}`);
      const count = response.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error fetching notification count:', error);
    }
  };

  return (
    <View style={[styles.headerContainer, isBlueTheme ? styles.blueThemeContainer : styles.whiteThemeContainer]}>
      <View style={styles.headerContent}>
        {/* User Pill */}
        <View style={styles.userPill}>
          <View style={styles.logoCircle}>
             <Image
              source={require('../assets/DoctorlogoApp1.png')}
              style={styles.pillAvatar}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.welcomeText}>Welcome To DrZ</Text>
            <Text style={styles.doctorNameText}>{doctorName}</Text>
          </View>
        </View>

        {/* Right Notification Icon */}
        <TouchableOpacity style={styles.notificationCircle} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={22} color="#0066FF" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    paddingTop: 45, // For status bar
    paddingBottom: 15,
  },
  blueThemeContainer: {
    backgroundColor: '#0066FF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
  },
  whiteThemeContainer: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  logoCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pillAvatar: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  textContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  welcomeText: {
    color: '#888',
    fontSize: 10,
    marginBottom: 2,
  },
  doctorNameText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
