import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Use same IP configuration as other screens
const IP_ADDRESS = '10.10.11.90'; 
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const NotificationPatient = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchNotifications();
    }
  }, [isFocused]);

  const handleMarkAllAsRead = async () => {
    if (!user || (!user.contactNumber && !user.mobile)) return;
    try {
      const mobile = user.contactNumber || user.mobile;
      await axios.put(`${BASE_URL}/api/notifications/readAll/patient/${mobile}`);
      // Update local state visually
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.log("Error marking as read", error);
    }
  };

  const fetchNotifications = async () => {
    if (!user || (!user.contactNumber && !user.mobile)) {
      setLoading(false);
      return;
    }
    
    try {
      const mobile = user.contactNumber || user.mobile;
      const response = await axios.get(`${BASE_URL}/api/notifications/patient/${mobile}`);
      
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
        } else if (n.title.includes('Completed')) {
          iconColor = '#8E44AD';
          iconName = 'check-all';
        }

        return {
          id: n.id || Math.random().toString(),
          title: n.title,
          message: n.message,
          iconName,
          iconColor,
          isRead: n.isRead,
          date: new Date(n.createdAt).toLocaleDateString()
        };
      });

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.notificationCard, !item.isRead && styles.unreadCard]}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
        <Icon name={item.iconName} size={30} color={item.iconColor} />
      </View>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.cardMessage}>{item.message}</Text>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#1C3E55" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllAsRead} style={{ padding: 4 }}>
          <Icon name="check-all" size={26} color="#1C3E55" />
        </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C3E55' },
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
    alignItems: 'center'
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
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E74C3C', marginTop: 4, marginLeft: 8 },
  cardMessage: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardDate: { fontSize: 12, color: '#999', marginTop: 8, alignSelf: 'flex-end' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 10, fontSize: 16, color: '#888' }
});

export default NotificationPatient;
