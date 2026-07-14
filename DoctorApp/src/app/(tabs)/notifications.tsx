import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../../components/Header';
import { Ionicons } from '@expo/vector-icons';

const NOTIFICATIONS = [
  {
    id: '1',
    title: 'New Appointment Booked',
    description: 'A new appointment has been booked with Arjun Suresh on 3/25/2026, 1:12 PM. Please review your schedule and prepare for the consultation.',
    date: '25/03/2026',
    time: '14:24',
    relativeTime: '10 Min Ago',
    isNew: true,
  },
  {
    id: '2',
    title: 'Appointment Reminder - Tomorrow',
    description: 'Reminder: You have an appointment with Patient Arjun Suresh scheduled tomorrow at 1:30 PM. Please ensure your availability.',
    date: '19/02/2026',
    time: '14:24',
    relativeTime: '15 Min Ago',
    isNew: false,
  },
  {
    id: '3',
    title: 'Appointment Reminder - [2 Hours Before]',
    description: 'Your appointment with Patient Suresh is scheduled to begin in 2 hours at 12:30 PM. Please be ready for the consultation.',
    date: '19/02/2026',
    time: '14:24',
    relativeTime: '2 Min Ago',
    isNew: false,
  },
];

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Header isNotification />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Notification</Text>

        {NOTIFICATIONS.map((item) => (
          <View key={item.id} style={styles.notificationCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={40} color="#ccc" />
            </View>
            <View style={styles.contentContainer}>
              <Text style={[styles.title, item.isNew && styles.newTitle]}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <View style={styles.footer}>
                <Text style={styles.footerText}>{item.date} - {item.time}</Text>
                <Text style={styles.footerText}>{item.relativeTime}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  newTitle: {
    color: '#0084FF',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 10,
    color: '#A0A0A0',
  },
});
