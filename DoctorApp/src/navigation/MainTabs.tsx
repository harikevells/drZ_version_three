import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Image, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeScreen from '../screens/HomeScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PushMessagesScreen from '../screens/PushMessagesScreen';
import PrescriptionScreen from '../screens/PrescriptionScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

export default function MainTabs() {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 20,
          backgroundColor: '#0066FF',
          height: 70,
          borderRadius: 35,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: -5 },
        },
        tabBarItemStyle: {
          margin: 0,
          padding: 0,
          height: 70,
        },
        tabBarIconStyle: {
          flex: 1,
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarIcon: ({ focused }) => {
          let labelName = route.name;
          let customIconSource = null;
          let isVectorIcon = false;
          let vectorIconName = '';

          if (route.name === 'Home') {
            customIconSource = require('../../assets/images/home.png');
          } else if (route.name === 'Appointment') {
            customIconSource = require('../../assets/images/appointment.png');
          } else if (route.name === 'Messages') {
            isVectorIcon = true;
            vectorIconName = 'bullhorn-variant';
          } else if (route.name === 'Prescription') {
            isVectorIcon = true;
            vectorIconName = 'clipboard-text-outline';
          } else if (route.name === 'Profile') {
            customIconSource = require('../../assets/images/profilesIcon.png');
          }

          const tintColor = '#FFFFFF';

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {/* Hover Pill Background for Active Tab */}
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
              }}>
                {isVectorIcon ? (
                  <Icon name={vectorIconName} size={22} color={tintColor} />
                ) : (
                  <Image 
                    source={customIconSource} 
                    style={{ width: 22, height: 22, resizeMode: 'contain', tintColor: tintColor }} 
                  />
                )}
                <Text numberOfLines={1} style={{ 
                  color: tintColor, 
                  fontSize: 10, 
                  marginTop: 4, 
                  fontWeight: focused ? 'bold' : '600' 
                }}>
                  {labelName}
                </Text>
              </View>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Appointment" component={AppointmentScreen} />
      <Tab.Screen name="Prescription" component={PrescriptionScreen} />
      <Tab.Screen name="Messages" component={PushMessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
