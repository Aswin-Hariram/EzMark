import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <SafeAreaView>
        {/* Image Section */}
        <Image style={styles.image} source={require('../assets/Login/undraw_step-to-the-sun_wp49.png')} />

        {/* Login Text */}
        <Text style={styles.loginText}>Login</Text>

        {/* Input Fields Section */}
        <View style={styles.inputContainer}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/email.png')} />
            <TextInput style={styles.textInput} placeholder='Email ID' />
          </View>
          <Divider/>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/lock.png')} />
            <TextInput style={styles.textInput} placeholder='Password' secureTextEntry />
            <Text style={styles.forgotText}>Forgot?</Text>
          </View>
          <Divider/>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        {/* Signup */}
        <Text style={styles.signup}>New to EMark App? <Text style={{color:'blue'}}>Register</Text></Text>
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
    width: 400,
    height: 300,
    alignSelf: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 30,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'column',
    gap: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop:30
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
    color: 'blue',
    fontWeight:'3000',
    marginLeft: 'auto',
  },
  loginButton: {
    backgroundColor: 'blue',
    width: 300,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    marginLeft:30
  },
  loginButtonText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
  },
  signup:{
    textAlign:'center',
    marginTop:50,
    fontSize:17
  }
});
