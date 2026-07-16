import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, Modal, ScrollView } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use same IP configuration as other screens
import { API_BASE_URL } from '../config';
const BASE_URL = API_BASE_URL;

const getTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} mon${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} yr${diffInYears > 1 ? 's' : ''} ago`;
};

const NotificationPatient = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPushId, setExpandedPushId] = useState(null);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchNotifications();
    }
  }, [isFocused]);

  // Tick icon click → mark ALL as read (count = 0)
  const handleMarkAllAsRead = async () => {
    try {
      const mobile = user.contactNumber || user.mobile;
      await axios.put(`${BASE_URL}/api/notifications/readAll/patient/${mobile}`);
      
      const pushIds = notifications.filter(n => n.isPushNotification).map(n => n.id);
      if (pushIds.length > 0) {
        const readPushIdsStr = await AsyncStorage.getItem('readPushNotificationIds');
        const readPushIds = readPushIdsStr ? JSON.parse(readPushIdsStr) : [];
        const newReadPushIds = [...new Set([...readPushIds, ...pushIds])];
        await AsyncStorage.setItem('readPushNotificationIds', JSON.stringify(newReadPushIds));
      }

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.log('Error marking all as read', error);
    }
  };

  // Notification box/card click → mark SINGLE notification as read (count -1)
  const handleMarkSingleRead = async (notifId, isPushNotification = false) => {
    try {
      if (isPushNotification) {
        const readPushIdsStr = await AsyncStorage.getItem('readPushNotificationIds');
        const readPushIds = readPushIdsStr ? JSON.parse(readPushIdsStr) : [];
        if (!readPushIds.includes(notifId)) {
          readPushIds.push(notifId);
          await AsyncStorage.setItem('readPushNotificationIds', JSON.stringify(readPushIds));
        }
      } else {
        await axios.put(`${BASE_URL}/api/notifications/${notifId}/read`);
      }
      
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.log('Error marking notification as read', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user || (!user.contactNumber && !user.mobile)) {
      setLoading(false);
      return;
    }

    try {
      const mobile = user.contactNumber || user.mobile;
      const timestamp = new Date().getTime();
      const response = await axios.get(`${BASE_URL}/api/notifications/patient/${mobile}?t=${timestamp}`);
      
      const realNotifications = response.data || [];

      const formattedNotifications = realNotifications.map(n => {
        let iconName = 'bell-outline';
        let iconColor = '#1C3E55';

        if (n.title.includes('Submitted') || n.title.includes('Booked')) {
          iconColor = '#3498DB';
          iconName = 'calendar-check-outline';
        } else if (n.title.includes('Approved')) {
          iconColor = '#27AE60';
          iconName = 'check-circle-outline';
        } else if (n.title.includes('Cancelled') || n.title.includes('Rejected')) {
          iconColor = '#E74C3C';
          iconName = 'close-circle-outline';
        } else if (n.title.includes('Rescheduled')) {
          iconColor = '#F39C12';
          iconName = 'calendar-clock-outline';
        } else if (n.title.includes('Prescription')) {
          iconColor = '#5F76FE';
          iconName = 'file-document-edit-outline';
        } else if (n.title.includes('Completed')) {
          iconColor = '#8E44AD';
          iconName = 'check-all';
        }

        return {
          id: n.id || n._id || Math.random().toString(),
          booking_id: n.booking_id || n.appointment_id || n.appointmentId,
          title: n.title,
          message: n.message,
          iconName,
          iconColor,
          isRead: n.isRead,
          isPushNotification: false,
          date: `${String(new Date(n.createdAt).getDate()).padStart(2, '0')}/${String(new Date(n.createdAt).getMonth() + 1).padStart(2, '0')}/${new Date(n.createdAt).getFullYear()} - ${getTimeAgo(n.createdAt)}`,
          createdAt: new Date(n.createdAt).getTime()
        };
      });

      // Fetch global push notifications
      let pushNotifications = [];
      try {
        const readPushIdsStr = await AsyncStorage.getItem('readPushNotificationIds');
        const readPushIds = readPushIdsStr ? JSON.parse(readPushIdsStr) : [];
        
        const pushRes = await axios.get(`${BASE_URL}/api/push-notifications/active`);
        pushNotifications = pushRes.data.map(pn => ({
          id: pn._id || pn.id || Math.random().toString(),
          title: pn.title,
          message: pn.description,
          iconName: 'bullhorn-outline',
          iconColor: '#6B7AFF',
          isRead: readPushIds.includes(pn._id || pn.id),
          isPushNotification: true,
          fromDate: pn.fromDate,
          toDate: pn.toDate,
          image: pn.image,
          role: pn.role,
          doctorName: pn.doctorName,
          createdDateOnly: `${String(new Date(pn.createdAt).getDate()).padStart(2, '0')}/${String(new Date(pn.createdAt).getMonth() + 1).padStart(2, '0')}/${new Date(pn.createdAt).getFullYear()}`,
          date: `${String(new Date(pn.createdAt).getDate()).padStart(2, '0')}/${String(new Date(pn.createdAt).getMonth() + 1).padStart(2, '0')}/${new Date(pn.createdAt).getFullYear()} - ${getTimeAgo(pn.createdAt)}`,
          createdAt: new Date(pn.createdAt).getTime()
        }));
      } catch (e) {
        console.log("Error fetching push notifications", e);
      }

      // Merge and sort
      const combined = [...formattedNotifications, ...pushNotifications].sort((a, b) => b.createdAt - a.createdAt);

      setNotifications(combined);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedPushId === item.id;
    return (
    <TouchableOpacity
      activeOpacity={item.isRead ? 1 : 0.7}
      onPress={() => {
        if (!item.isRead) {
          handleMarkSingleRead(item.id, item.isPushNotification);
        }
        if (item.isPushNotification) {
          setExpandedPushId(isExpanded ? null : item.id);
        } else if (item.title && item.title.includes('Prescription')) {
          navigation.navigate('Dashboard', { 
            screen: 'PrescriptionTab', 
            params: { blinkAppId: item.booking_id, blinkMessage: item.message } 
          });
        } else {
          navigation.navigate('Dashboard', { 
            screen: 'PatientAppointments', 
            params: { blinkBookingId: item.booking_id, blinkMessage: item.message } 
          });
        }
      }}
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
        <Icon name={item.iconName} size={30} color={item.iconColor} />
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
          {item.isPushNotification && (
            <Icon name={isExpanded ? 'menu-up' : 'menu-down'} size={28} color="#333" />
          )}
        </View>
        <Text style={styles.cardMessage} numberOfLines={item.isPushNotification ? undefined : 5}>
            {item.message}
        </Text>
        {item.isPushNotification && item.fromDate && item.toDate && (
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="calendar-range" size={16} color="#6B7AFF" style={{ marginRight: 6 }} />
                <Text style={{ fontWeight: 'bold', color: '#555', fontSize: 13 }}>
                   {item.fromDate} To {item.toDate}
                </Text>
            </View>
        )}
        
        {item.isPushNotification && isExpanded && (
          <View style={{ marginTop: 10 }}>
            {item.image ? (
              <Image 
                source={{ uri: item.image }} 
                style={{ width: '100%', height: 200, borderRadius: 8 }} 
                resizeMode="cover" 
              />
            ) : null}
            <Text style={{ fontWeight: '500', color: '#888', fontSize: 12, marginTop: 6 }}>
                {`Created by: ${item.role === 'doctor' ? (item.doctorName ? 'Dr. ' + item.doctorName : 'Doctor') : 'Admin'}`}
            </Text>
          </View>
        )}

        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Top Row: Welcome Pill & Bell */}
        <View style={styles.topRow}>
          <View style={styles.welcomePill}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.welcomeText}>Welcome To DrZ</Text>
          </View>
        </View>

        {/* Bottom Row: Back & Title */}
        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={28} color="#4A4A4A" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Notification / அறிவிப்பு</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#1C3E55" />
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="bell-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No new notifications</Text>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingRight: 16,
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 46,
    // backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 24,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5F76FE',
    borderWidth: 1.5,
    borderColor: '#F5F5F5',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  content: { flex: 1 },
  listContainer: { padding: 16 },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'flex-start'
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4, flex: 1 },
  unreadText: { color: '#000', fontWeight: '900' },
  unreadCard: { backgroundColor: '#F4F9FC', borderColor: '#D0E1E8', borderWidth: 1 },
  unreadDot: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#E74C3C', borderWidth: 2, borderColor: '#FFF' },
  cardMessage: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardDate: { fontSize: 12, color: '#999', marginTop: 8, textAlign: 'right', paddingRight: 5 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 16, color: '#888' }
});

export default NotificationPatient;
