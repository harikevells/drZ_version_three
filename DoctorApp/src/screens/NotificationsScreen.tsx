import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.10.11.90:5000/api/notifications';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverOffset, setServerOffset] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.doctorName) {
          const response = await axios.get(`${API_URL}/doctor/${parsed.doctorName}`);
          
          if (response.headers && response.headers.date) {
            const srvTime = new Date(response.headers.date).getTime();
            const localTime = new Date().getTime();
            setServerOffset(srvTime - localTime);
          }
          
          setNotifications(response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await axios.put(`${API_URL}/${id}/read`);
      setNotifications((prev) => 
        prev.map((notif: any) => (notif._id === id || notif.id === id ? { ...notif, isRead: true } : notif))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((n: any) => !n.isRead);
      for (const n of unreadNotifs) {
        await axios.put(`${API_URL}/${n._id || n.id}/read`);
      }
      setNotifications((prev) => prev.map((n: any) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[d.getDay()];
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${datePart} - ${dayName}`;
  };

  const timeAgo = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const trueCurrentTime = currentTime.getTime() + serverOffset;
    const diffMs = trueCurrentTime - d.getTime();
    const finalDiffMs = Math.max(0, diffMs);
    const diffMins = Math.floor(finalDiffMs / 60000);
    if (diffMins < 1) return 'Just Now';
    if (diffMins < 60) return diffMins === 1 ? '1 Min Ago' : `${diffMins} Mins Ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return diffHrs === 1 ? '1 Hour Ago' : `${diffHrs} Hours Ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return diffDays === 1 ? '1 Day Ago' : `${diffDays} Days Ago`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBlueBackground} />
      <Header isBlueTheme={false} />
      
      <View style={styles.content}>
        <View style={styles.titleHeader}>
          <Text style={styles.pageTitle}>Notification</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Ionicons name="checkmark-done-circle" size={24} color="#0066FF" />
          </TouchableOpacity>
        </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#0084FF" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {notifications.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#999', marginTop: 50 }}>No notifications found.</Text>
          ) : (
            notifications.map((item: any) => (
              <TouchableOpacity 
                key={item.id || item._id} 
                style={styles.notificationCard}
                onPress={() => { 
                  if (!item.isRead) handleMarkAsRead(item.id || item._id);
                  const match = item.message ? item.message.match(/Patient\s+(.*?)\s+has/i) : null;
                  const patientName = match && match[1] ? match[1].trim() : null;
                  if (patientName) {
                    AsyncStorage.setItem('highlightedPatientName', patientName);
                  }
                  (navigation as any).navigate('MainTabs', { 
                    screen: 'Appointment', 
                    params: { highlightedPatientName: patientName } 
                  });
                }}
              >
                <View style={styles.contentContainer}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.title}</Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.description}>{item.message}</Text>
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>{formatDate(item.createdAt)}</Text>
                    <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  topBlueBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: '#0066FF',
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    paddingTop: 20,
    marginTop: 10,
  },
  titleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 5,
    marginRight: 5,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  notificationCard: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4F',
    marginLeft: 10,
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    color: '#A0A0A0',
  },
  timeText: {
    fontSize: 11,
    color: '#A0A0A0',
  }
});
