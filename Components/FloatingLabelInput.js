import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Text } from 'react-native';

const FloatingLabelInput = ({ label, value, onChangeText, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text
        style={[
          styles.label,
          (isFocused || value) && styles.floatingLabel, // Adjust label position
        ]}
      >
        {label}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </View>
  );
};

export default FloatingLabelInput;

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  label: {
    position: 'absolute',
    left: 10,
    top: 15,
    fontSize: 16,
    color: 'gray',
    transition: '0.2s', // Optional for smooth animations
  },
  floatingLabel: {
    top: -10,
    left: 10,
    fontSize: 12,
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    padding: 10,
    paddingTop: 20, // Ensure text doesn't overlap with label
    fontSize: 16,
  },
});
