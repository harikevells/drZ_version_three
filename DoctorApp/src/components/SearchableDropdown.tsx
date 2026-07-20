import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Keyboard } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface SearchableDropdownProps {
  data: any[];
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  labelKey: string;
}

export default function SearchableDropdown({ data, value, onChangeText, placeholder, labelKey }: SearchableDropdownProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if (value) {
      setFilteredData(data.filter(item =>
        item[labelKey]?.toLowerCase().includes(value.toLowerCase())
      ));
    } else {
      setFilteredData(data);
    }
  }, [value, data, labelKey]);

  const handleSelect = (item: any) => {
    onChangeText(item[labelKey]);
    setShowOptions(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setShowOptions(true);
          }}
          onFocus={() => setShowOptions(true)}
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setShowOptions(!showOptions)}
        >
          <Ionicons name={showOptions ? "chevron-up" : "chevron-down"} size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {showOptions && filteredData.length > 0 && (
        <View style={[styles.dropdown, { maxHeight: 180 }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {filteredData.map((item, index) => (
              <TouchableOpacity
                key={index.toString()}
                style={styles.optionItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item[labelKey]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1, // Ensure dropdown appears over other elements
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  iconContainer: {
    padding: 10,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 999,
    overflow: 'hidden',
  },
  optionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  }
});
