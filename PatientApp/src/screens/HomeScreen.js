import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

const HomeScreen = () => {
  return (
    <ImageBackground
      source={require('../assets/bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <Text style={styles.text}>Welcome to Home Screen 🏠</Text>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default HomeScreen;
