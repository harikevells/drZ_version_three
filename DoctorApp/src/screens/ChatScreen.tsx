import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [unreadCount, setUnreadCount] = useState(0);
  const [doctorName, setDoctorName] = useState('Doctor');

  useEffect(() => {
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
      const response = await axios.get(`${API_BASE_URL}/notifications/doctor/${name}`);
      const count = response.data.filter((n: any) => !n.isRead).length;
      setUnreadCount(count);
    } catch (error) {
      console.log('Error fetching notification count:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blueTopBackground} />
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationIconContainer} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#0D6EFD" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.whiteBackground}>
        <View style={styles.content}>
          <Image 
            source={require('../assets/chatimage.png')} 
            style={styles.image} 
            resizeMode="contain" 
          />
          <Text style={styles.underConstructionText}>UNDER{'\n'}CONSTRUCTION</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  blueTopBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#0D6EFD',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notificationIconContainer: {
    backgroundColor: '#FFF',
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
    borderColor: '#FFF',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    width: '95%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 50,
  },
  image: {
    width: '100%',
    height: 300,
    marginBottom: 40,
  },
  underConstructionText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#222',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.5,
  },
});
