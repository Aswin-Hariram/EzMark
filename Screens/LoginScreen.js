import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState, useMemo } from 'react';
import { Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadioGroup from 'react-native-radio-buttons-group';
import Entypo from '@expo/vector-icons/Entypo';
import { Colors } from '../assets/Colors';

const LoginScreen = () => {
  const [selectedId, setSelectedId] = useState('1'); // Default selection set to "Student"
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [showPassword, setShowPassword] = useState(false); // State for password visibility toggle

  const radioButtons = useMemo(
    () => [
      {
        id: '1',
        label: 'Student',
        value: 'Student',
      },
      {
        id: '2',
        label: 'Teacher',
        value: 'Teacher',
      },
      {
        id: '3',
        label: 'Admin',
        value: 'Admin',
      },
    ],
    []
  );

  function handleLogin(){
    console.log('Email:', email);
    console.log('Password',password);
  }
  return (
    <View style={styles.container}>
      <SafeAreaView>
        {/* Image Section */}
        <Image style={styles.image} source={require('../assets/Login/signinImage.png')} />

        {/* Login Text */}
        <Text style={[styles.loginText, { fontFamily: 'Signika' }]}>Login</Text>

        {/* Input Fields Section */}
        <View style={styles.inputContainer}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/email.png')} />
            <TextInput
              style={styles.textInput}
              placeholder="Email ID"
              inputMode="email"
              value={email}
              onChangeText={setEmail}
            />
            {email.length > 0 && (
              <TouchableOpacity onPress={() => setEmail('')}>
                <Entypo name="cross" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
          <Divider />

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/lock.png')} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            {password.length === 0 ? (
              <Text style={styles.forgotText}>Forgot?</Text>
            ) : (
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Entypo
                  name={showPassword ? 'eye-with-line' : 'eye'}
                  size={20}
                  color="gray"
                />
              </TouchableOpacity>
            )}
          </View>
          <Divider />
        </View>

        {/* Radio Button Section */}
        <View style={styles.radioButtonContainer}>
          <RadioGroup
            layout="row" // Set the layout to horizontal
            radioButtons={radioButtons}
            onPress={setSelectedId}
            selectedId={selectedId} // Pass default selected ID
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Signup */}
        <Text style={styles.signup}>
          New to EzMark App, <Text style={{ color: Colors.SECONDARY }}>Need Help?</Text>
        </Text>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: 'white',
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: 'center',
    marginBottom: 10,
    resizeMode: 'contain',
  },
  loginText: {
    fontSize: 30,
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'column',
    gap: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 25,
  },
  icon: {
    width: 20,
    height: 20,
    marginTop: 0,
  },
  clearIcon: {
    width: 20,
    height: 20,
    tintColor: 'gray', // Adjust color as needed
  },
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    borderBottomColor: 'gray',
  },
  forgotText: {
    marginTop: 10,
    color: Colors.SECONDARY,
    fontSize: 17,
    fontFamily: 'Signika',
    fontWeight: 'condensedBold',
    marginLeft: 'auto',
  },
  radioButtonContainer: {
    marginTop: 30,
    flexDirection: 'row', // Horizontal layout for the radio buttons
    justifyContent: 'space-around', // Space between the radio buttons
    alignItems: 'center', // Align the radio buttons in the center
  },
  loginButton: {
    backgroundColor: Colors.PRIMARY,
    width: 300,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    alignSelf: 'center',
  },
  loginButtonText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
  },
  signup: {
    textAlign: 'center',
    marginTop: 25,
    fontSize: 17,
  },
});
