import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      {/* Blue Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Chat</Text>
      </View>

      {/* Main Content Area with Rounded Top Corners */}
      <View style={styles.contentContainer}>
        <Image 
          source={require('../../assets/images/OBJECTS.png')} 
          style={styles.illustration}
          resizeMode="contain"
        />
        <Text style={styles.constructionText}>UNDER{'\n'}CONSTRUCTION</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0066FF', // Top blue part matching header
  },
  header: {
    paddingTop: 50, // Adjust for status bar
    paddingHorizontal: 25,
    paddingBottom: 30,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100, // Make room for the floating pill tab bar
  },
  illustration: {
    width: width * 0.85,
    height: width * 0.85,
    marginBottom: 30,
  },
  constructionText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#B0B0B0', // Gray color
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 36,
  }
});
