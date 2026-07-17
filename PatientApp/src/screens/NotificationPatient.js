import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Use same IP configuration as other screens
const IP_ADDRESS = '10.10.11.90'; 
const PORT = '5000';
const BASE_URL = `http://${IP_ADDRESS}:${PORT}`;

const CIRCLE_COLORS = ['#F9C74F', '#FF7F9F', '#E73B25', '#74B9FF', '#A29BFE'];

const NotificationPatient = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverOffset, setServerOffset] = useState(0);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchNotifications();
    }
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    if (!user || (!user.contactNumber && !user.mobile)) {
      setLoading(false);
      return;
    }
    
    try {
      const mobile = user.contactNumber || user.mobile;
      const response = await axios.get(`${BASE_URL}/api/notifications/patient/${mobile}`);
      
      if (response.headers && response.headers.date) {
        const srvTime = new Date(response.headers.date).getTime();
        const localTime = new Date().getTime();
        setServerOffset(srvTime - localTime);
      }
      
      const realNotifications = response.data || [];
      
      const formattedNotifications = realNotifications.map(n => ({
        id: n._id || n.id || Math.random().toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        imageUrl: n.imageUrl || n.image || null,
        isRead: n.isRead !== undefined ? n.isRead : false,
        createdAt: n.createdAt
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${BASE_URL}/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getInitials = (title) => {
    if (!title) return 'NA';
    const words = title.trim().split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.substring(0, 2).toUpperCase();
  };

  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const trueCurrentTime = currentTime.getTime() + serverOffset;
    const diffMs = trueCurrentTime - dateObj.getTime();
    
    // Prevent negative times if there's a slight network delay offset
    const finalDiffMs = Math.max(0, diffMs);
    
    const diffMins = Math.floor(finalDiffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} Min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} Hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} Day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  const NotificationItem = ({ item, index }) => {
    const [expanded, setExpanded] = useState(false);
    const t = (item.title || '').toLowerCase();
    const isCamp = item.type === 'camp' || t.includes('camp') || t.includes('முகாம்');
    const isAppointment = item.type === 'appointment' || t.includes('appointment') || t.includes('நேர்காணல்');

    let iconContent = <Text style={styles.initialsText}>{getInitials(item.title)}</Text>;
    let bgColor = CIRCLE_COLORS[index % CIRCLE_COLORS.length];

    if (isCamp) {
      iconContent = <Icon name="bullhorn" size={20} color="#FFF" />;
      bgColor = '#F9C74F'; // Yellow/Orange
    } else if (isAppointment) {
      iconContent = <Text style={styles.initialsText}>AP</Text>;
      bgColor = '#FF7F9F'; // Pink
    }

    return (
      <View style={styles.notificationWrapper}>
        <TouchableOpacity 
          style={styles.notificationRow}
          activeOpacity={0.7}
          onPress={() => { 
            if (!item.isRead) handleMarkAsRead(item.id); 
            if (isCamp) {
              setExpanded(!expanded);
            } else {
              if (item.message) {
                import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => {
                  AsyncStorage.setItem('highlightedPatientMessage', item.message);
                });
              }
              navigation.navigate('Dashboard', { 
                screen: 'AppointmentsListTab',
                params: { highlightedMessage: item.message }
              });
            }
          }}
        >
          {/* Unread blue dot */}
          <View style={styles.dotContainer}>
            {!item.isRead ? <View style={styles.blueDot} /> : null}
          </View>
          
          {/* CARD */}
          <View style={[
            styles.cardContainer, 
            isCamp ? styles.campCard : (!item.isRead ? styles.unreadCard : styles.readCard)
          ]}>
            <View style={styles.cardInnerRow}>
              {/* Icon/Initials Circle */}
              <View style={[styles.initialsCircle, { backgroundColor: bgColor }]}>
                {iconContent}
              </View>

              {/* Content */}
              <View style={styles.notificationContent}>
                <View style={styles.titleRowInline}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {isCamp && (
                    <Icon name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                  )}
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                
                {/* Show image if expanded and it's a camp */}
                {isCamp && expanded && (
                  <Image 
                    source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/logo.png')} 
                    style={styles.campImage} 
                    resizeMode="cover"
                  />
                )}

                <Text style={styles.cardDate}>{timeAgo(item.createdAt)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        {!isCamp && <View style={styles.divider} />}
      </View>
    );
  };

  const renderItem = ({ item, index }) => (
    <NotificationItem item={item} index={index} />
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.welcomeText}>Welcome To DrZ</Text>
        </View>

        <TouchableOpacity style={styles.bellIconContainer}>
          <Icon name="bell-outline" size={22} color="#6276F5" />
          {/* Unread count badge on bell */}
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* BACK BUTTON AND TITLE */}
      <View style={styles.titleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#555" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Notification / அறிவிப்பு</Text>
        </View>

        {/* Mark all as read button */}
        <TouchableOpacity style={styles.markReadButton} onPress={() => {
          // Dummy mark as read logic for demo
          const updated = notifications.map(n => ({...n, isRead: true}));
          setNotifications(updated);
        }}>
          <Icon name="check-all" size={24} color="#6276F5" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#1C3E55" />
        ) : notifications.length > 0 ? (
          <FlatList
            data={notifications}
            extraData={currentTime}
            keyExtractor={(item, index) => item.id || index.toString()}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 35 : 50 
  },
  
  // Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24,
    marginBottom: 30 
  },
  userInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F4F4F4', 
    padding: 6, 
    paddingRight: 18, 
    borderRadius: 25 
  },
  logo: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    marginRight: 10, 
    backgroundColor: '#FFF' 
  },
  welcomeText: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: '#111' 
  },
  bellIconContainer: { 
    backgroundColor: '#F4F4F4', 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30', // Red for count badge
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#FFF'
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },

  // Title Row
  titleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 24, 
    marginBottom: 25 
  },
  screenTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginLeft: 10 
  },
  markReadButton: {
    padding: 5,
  },

  // Content
  content: { 
    flex: 1 
  },
  listContainer: { 
    paddingBottom: 20
  },

  // Notification Card
  notificationWrapper: {
    marginBottom: 10,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  dotContainer: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 34, // Aligns with the center of the icon inside the card
    marginRight: 6,
  },
  blueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A60F0',
  },
  cardContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
    borderRadius: 8,
  },
  campCard: {
    backgroundColor: '#F6F8FA', // Distinct light grey for camps
    padding: 12, // add some inner padding since it has a background
    marginTop: 4,
    marginBottom: 4,
  },
  unreadCard: {
    backgroundColor: 'transparent',
  },
  readCard: {
    backgroundColor: 'transparent',
  },
  cardInnerRow: {
    flexDirection: 'row',
  },
  initialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  initialsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationContent: {
    flex: 1,
  },
  titleRowInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  cardMessage: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  campImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: '#F0F0F0',
  },
  cardDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6276F5',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginLeft: 70, // Align with the start of the text content
    marginRight: 24,
  },

  // Empty State
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyText: { 
    marginTop: 10, 
    fontSize: 16, 
    color: '#888' 
  }
});

export default NotificationPatient;

