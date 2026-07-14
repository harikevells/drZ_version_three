import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const { width } = Dimensions.get('window');

interface HeaderProps {
  title?: string;
  isNotification?: boolean;
  variant?: 'default' | 'appointment';
}

export default function Header({ title, isNotification = false, variant = 'default' }: HeaderProps) {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [doctorName, setDoctorName] = useState('Doctor');
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
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

    // Get Time-based Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Get Formatted Date
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();

    setCurrentDate(`${dayName}, ${monthName} ${dayNum}, ${year}`);
  }, []);

  useEffect(() => {
    if (isFocused && doctorName !== 'Doctor') {
      fetchUnreadCount(doctorName);
    }
  }, [isFocused]);

  const fetchUnreadCount = async (name: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/doctor/${name}`);
      const count = response.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error fetching notification count:', error);
    }
  };

  return (
    <View style={[styles.headerContainer, variant === 'appointment' && styles.appointmentHeaderContainer]}>
      <View style={styles.headerContent}>
        <View style={[styles.userInfo, variant === 'appointment' && styles.appointmentUserInfo]}>
          <Image
            source={require('../assets/DoctorlogoApp1.png')}
            style={styles.avatar}
          />
          <View style={styles.textContainer}>
            {title ? (
              <Text style={styles.doctorName}>{title}</Text>
            ) : (
              <>
                <Text style={styles.greeting}>Welcome To DrZ</Text>
                <Text style={styles.doctorName}>Dr.{doctorName.replace('Dr. ', '').replace('Dr.', '')}</Text>
              </>
            )}
          </View>
        </View>
        {!isNotification && (
          <TouchableOpacity style={[styles.notificationIconContainer, variant === 'appointment' && styles.appointmentNotificationIcon]} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={variant === 'appointment' ? "#0D6EFD" : "#052A3F"} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#f5f7feff',
    height: 80,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 8,
    paddingHorizontal: 15,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatar: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  textContainer: {
    marginLeft: 10,
    marginRight: 15,
  },
  greeting: {
    color: '#666',
    fontSize: 12,
    // marginBottom: 2,
    width: 100,

  },
  doctorName: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationIconContainer: {
    backgroundColor: '#E0E9FF',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E9FF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  appointmentHeaderContainer: {
    backgroundColor: '#0D6EFD',
    paddingTop: 20,
    paddingBottom: 25,
    marginBottom: -20, 
    height: 200,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    justifyContent: 'flex-start',
  },
  appointmentUserInfo: {
    borderRadius: 50,
    backgroundColor: '#FFF',
    padding: 5,
    paddingRight: 20,
    shadowOpacity: 0,
    elevation: 0,
  },
  appointmentNotificationIcon: {
    backgroundColor: '#FFF',
    shadowOpacity: 0,
    elevation: 0,
  },
});
