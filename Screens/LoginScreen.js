import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RadioButtonItem, RadioButtonGroup } from 'expo-radio-button';

import { Colors } from '../assets/Colors';


const LoginScreen = () => {
  const [current, setCurrent] = useState('test2'); // Example of state management for selected option
 

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
            <TextInput style={styles.textInput} placeholder='Email ID' />
          </View>
          <Divider />

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/lock.png')} />
            <TextInput style={styles.textInput} placeholder='Password' secureTextEntry />
            <Text style={styles.forgotText}>Forgot?</Text>
          </View>
          <Divider />
        </View>

        {/* Radio Button Section */}
        <View style={styles.radioButtonContainer}>
          <RadioButtonGroup
            containerStyle={styles.radioButtonGroup}
            selected={current}
            onSelected={(value) => setCurrent(value)}
            radioBackground={Colors.SECONDARY}
          >
            <RadioButtonItem value="test2" label="Student" />
            <RadioButtonItem
              value="test"
              label="Teacher"
            />
            <RadioButtonItem
              value="test3"
              label="Admin"
            />
          </RadioButtonGroup>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Signup */}
        <Text style={styles.signup}>New to EMark App, <Text style={{ color: Colors.SECONDARY }}>Need Help?</Text></Text>
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
    objectFit: 'contain',
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
  textInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    borderBottomColor: 'gray',
  },
  forgotText: {
    marginTop: 10,
    color: Colors.SECONDARY,
    fontSize:17,
    fontFamily:'Signika',
    fontWeight: 'condensedBold',
    marginLeft: 'auto',
  
  },
  radioButtonContainer: {
    marginTop: 30,
  },
  radioButtonGroup: {
    flexDirection: 'row',
    justifyContent:'space-evenly',
    alignItems:'left',
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
