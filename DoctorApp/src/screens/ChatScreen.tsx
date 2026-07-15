import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.10.11.90:5000/api/appointments';

export default function ChatScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const fetchChats = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        const user = JSON.parse(storedData);
        // Fetch all appointments for doctor
        const response = await axios.get(`${API_URL}/all/${encodeURIComponent(user.doctorName)}`);
        // We only want Pending (new requests)
        const pending = response.data.filter((app: any) => app.status === 'Pending' || app.status === 'Approved');
        setAppointments(pending);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
    // Poll every 5 seconds for real-time feel
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.chatRow} onPress={() => setSelectedChat(item)}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color="#FFF" />
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.patientName}>{item.patient_name}</Text>
          <Text style={styles.timeText}>{item.appointment_date}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.status === 'Pending' ? 'New Booking Request received via AI Chat' : 'Booking Approved'}
        </Text>
      </View>
      {item.status === 'Pending' && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>1</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header />
      
      <View style={styles.headerTitleContainer}>
        <Text style={styles.screenTitle}>Patient Chats</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#052A3F" style={{ marginTop: 50 }} />
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>No new chat requests.</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item: any) => item.id || item._id}
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Chat Details Modal */}
      <Modal visible={!!selectedChat} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedChat(null)} style={{ padding: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.avatar, { width: 35, height: 35, borderRadius: 17.5, marginRight: 10 }]}>
                <Ionicons name="person" size={18} color="#FFF" />
              </View>
              <Text style={styles.modalTitle}>{selectedChat?.patient_name}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.chatHistory}>
            {/* AI Assistant summary message */}
            <View style={styles.botMessage}>
              <Text style={styles.botMessageText}>
                New appointment request via DrZ AI Assistant:{"\n\n"}
                Name: {selectedChat?.patient_name}{"\n"}
                Age: {selectedChat?.patient_age}{"\n"}
                Gender: {selectedChat?.patient_gender}{"\n"}
                Phone: {selectedChat?.login_mobile}{"\n"}
                Category: {selectedChat?.treatment_category}{"\n"}
                Date: {selectedChat?.appointment_date}{"\n"}
                Time: {selectedChat?.appointment_time}
              </Text>
            </View>
            
            {/* Dummy doctor response if approved */}
            {selectedChat?.status === 'Approved' && (
              <View style={styles.doctorMessage}>
                <Text style={styles.doctorMessageText}>
                  Your appointment is confirmed for {selectedChat.appointment_date} at {selectedChat.appointment_time}. See you then!
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.replyBox}>
            <View style={styles.inputDummy}>
              <Text style={{color: '#000'}}>Type a message...</Text>
            </View>
            <View style={styles.sendBtn}>
              <Ionicons name="send" size={18} color="#FFF" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerTitleContainer: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#052A3F' },
  chatRow: { flexDirection: 'row', padding: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#052A3F', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timeText: { fontSize: 12, color: '#999' },
  lastMessage: { fontSize: 14, color: '#666' },
  unreadBadge: { backgroundColor: '#E83F5B', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  unreadText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#999', marginTop: 10, fontSize: 16 },
  
  modalContainer: { flex: 1, backgroundColor: '#F0F2F5' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, backgroundColor: '#FFF', elevation: 2, paddingHorizontal: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  chatHistory: { flex: 1, padding: 15 },
  botMessage: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, borderTopLeftRadius: 0, alignSelf: 'flex-start', maxWidth: '85%', elevation: 1, marginBottom: 15 },
  botMessageText: { fontSize: 14, color: '#333', lineHeight: 22 },
  doctorMessage: { backgroundColor: '#DCF8C6', padding: 15, borderRadius: 12, borderTopRightRadius: 0, alignSelf: 'flex-end', maxWidth: '85%', elevation: 1 },
  doctorMessageText: { fontSize: 14, color: '#333', lineHeight: 20 },
  replyBox: { flexDirection: 'row', padding: 10, backgroundColor: '#FFF', alignItems: 'center' },
  inputDummy: { flex: 1, backgroundColor: '#F0F2F5', height: 45, borderRadius: 25, paddingHorizontal: 15, justifyContent: 'center' },
  sendBtn: { width: 45, height: 45, backgroundColor: '#ccc', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
