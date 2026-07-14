import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import AppointmentScreen from '../screens/AppointmentScreen';
import MedicalCampNotification from '../screens/MedicalCampNotification';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarButton: (props) => <TouchableOpacity {...props} activeOpacity={1} />,
        tabBarStyle: {
          backgroundColor: '#0D6EFD',
          height: 70,
          borderTopWidth: 0,
          elevation: 5,
          // position: 'absolute',
          bottom: 15,
          marginHorizontal: 20,
          borderRadius: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          paddingTop: 0,
          paddingBottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          flex: 1,
          width: '100%',
        },
        tabBarIcon: ({ focused }) => {
          let iconName = 'ellipse';
          let labelName = route.name;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Appointment') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Camp') {
            iconName = focused ? 'medkit' : 'medkit-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                borderRadius: 20,
                paddingVertical: 10,
                width: 80,
                height: 55,
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
      <Tab.Screen name="Camp" component={MedicalCampNotification} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
