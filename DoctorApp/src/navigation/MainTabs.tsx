import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const API_URL = 'http://10.10.11.90:5000/api/appointments';

export default function MainTabs() {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#052A3F',
          height: 80,
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          paddingTop: 5,
          paddingBottom: 5,
        },
        tabBarIconStyle: {
          flex: 1,
          height: 65,
          width: '100%',
        },
        tabBarIcon: ({ focused }) => {
          let iconName = 'ellipse';
          let labelName = route.name;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Appointment') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? '#114563' : 'transparent',
                borderRadius: 16,
                paddingVertical: 10,
                paddingHorizontal: 15,
                position: 'relative'
              }}
            >
              <Ionicons name={iconName} size={24} color="#FFF" />
              <Text numberOfLines={1} style={{ color: '#FFF', fontSize: 10, marginTop: 4, fontWeight: focused ? 'bold' : 'normal' }}>
                {labelName}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Appointment" component={AppointmentScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
