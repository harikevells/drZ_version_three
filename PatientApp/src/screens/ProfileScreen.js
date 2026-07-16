import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

const ProfileScreen = () => {
  const { user } = useContext(AuthContext);
  const { texts } = useContext(LanguageContext);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile / சுயவிவரம்</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.profileCard}>
          <Image source={require('../assets/user.png')} style={styles.avatar} />
          <Text style={styles.name}>{user?.name || "Patient Name"}</Text>
          <Text style={styles.phone}>{user?.contactNumber || user?.mobile || "+91 XXXXXXXXXX"}</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "N/A"}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C3E55',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  infoRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  }
});

export default ProfileScreen;
