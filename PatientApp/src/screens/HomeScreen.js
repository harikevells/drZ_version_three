import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const HomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();

  // Fetch unread notification count every time screen is focused
  useEffect(() => {
    if (isFocused && user) {
      fetchUnreadCount();
    }
  }, [isFocused, user]);

  const fetchUnreadCount = async () => {
    try {
      const mobile = user.contactNumber || user.mobile;
      const timestamp = new Date().getTime();
      
      // Fetch normal notifications
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/patient/${mobile}?t=${timestamp}`
      );
      const normalUnread = (response.data || []).filter(n => !n.isRead).length;

      // Fetch push notifications
      const pushRes = await axios.get(
        `${API_BASE_URL}/api/push-notifications/active`
      );
      
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const readPushIdsStr = await AsyncStorage.getItem('readPushNotificationIds');
      const readPushIds = readPushIdsStr ? JSON.parse(readPushIdsStr) : [];
      
      const pushUnread = (pushRes.data || []).filter(pn => {
        return !readPushIds.includes(pn._id || pn.id);
      }).length;

      setUnreadCount(normalUnread + pushUnread);
    } catch (error) {
      console.log('Error fetching notification count', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Notification Bell */}
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => navigation.navigate('NotificationPatient')}
      >
        <Icon name="bell-outline" size={28} color="#1C3E55" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.text}>Welcome to Home Screen 🏠</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  bellButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default HomeScreen;