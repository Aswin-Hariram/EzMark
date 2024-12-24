import React, { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadioGroup from 'react-native-radio-buttons-group';
import Entypo from '@expo/vector-icons/Entypo';
import { Colors } from '../assets/Colors';
import { auth, firestore } from '../Config/FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';

const LoginScreen = () => {
  const [selectedId, setSelectedId] = useState('1'); // Default selection set to "Student"
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const radioButtons = useMemo(
    () => [
      { id: '1', label: 'Student', value: 'Student' },
      { id: '2', label: 'Teacher', value: 'Teacher' },
      { id: '3', label: 'Admin', value: 'Admin' },
    ],
    []
  );

  const validateInput = (email, password) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number.'
      );
      return false;
    }

    return true;
  };

  const checkAdminAccess = async (email, type,password) => {
    try {
      const q = query(collection(firestore, 'UserData'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        if (doc.data().type === type) {
          await AsyncStorage.setItem('userType', type);
          await signInWithEmailAndPassword(auth, email, password);
          if (type === 'Admin') navigation.navigate('AdminDashboardScreen');
          else if (type === 'Teacher') navigation.navigate('TeacherDashboard');
          else if(type==='Student') navigation.navigate('StudentDashboard');
          else return;
          return;
        }
      }

      Alert.alert('Access Denied', 'You do not have the required permissions.');
    } catch (error) {
      console.error('Error querying Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateInput(email, password)) return;

    setLoading(true);

    try {
      const type = selectedId === '1' ? 'Student' : selectedId === '2' ? 'Teacher' : 'Admin';
      await checkAdminAccess(email, type,password);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={Colors.PRIMARY} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView>
        <Image style={styles.image} source={require('../assets/Login/signinImage.png')} />
        <Text style={styles.loginText}>Login</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/email.png')} />
            <TextInput
              style={styles.textInput}
              placeholder="Email ID"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {email.length > 0 && (
              <TouchableOpacity onPress={() => setEmail('')}>
                <Entypo name="cross" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
          <Divider />

          <View style={styles.inputWrapper}>
            <Image style={styles.icon} source={require('../assets/Login/lock.png')} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Entypo
                name={showPassword ? 'eye-with-line' : 'eye'}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          <Divider />
        </View>

        <View style={styles.radioButtonContainer}>
          <RadioGroup
            layout="row"
            radioButtons={radioButtons}
            onPress={setSelectedId}
            selectedId={selectedId}
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.signup}>
          New to EzMark App? <Text style={{ color: Colors.SECONDARY }}>Need Help?</Text>
        </Text>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
