import React, { useState, useMemo } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
} from 'react-native';
import { ActivityIndicator, Divider, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadioGroup from 'react-native-radio-buttons-group';
import { Colors } from '../assets/Colors';
import { auth, firestore } from '../Config/FirebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import LottieView from 'lottie-react-native';

const LoginScreen = ({navigation}) => {
  const [selectedId, setSelectedId] = useState('1'); // Default selection set to "Student"
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
 

  const radioButtons = useMemo(
    () => [
      { id: '1', label: 'Student', value: 'Student' },
      { id: '2', label: 'Teacher', value: 'Teacher' },
      { id: '3', label: 'Admin', value: 'Admin' },
    ],
    []
  );

  const validateInput = (email, password) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

  const checkAdminAccess = async (email, type, password) => {
    try {
      const q = query(collection(firestore, 'UserData'), where('email', '==', email));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        if (doc.data().type === type) {
          await AsyncStorage.setItem('userType', type);
          await signInWithEmailAndPassword(auth, email, password);
          if (type === 'Admin') navigation.replace('AdminDashboardScreen');
          else if (type === 'Teacher') navigation.replace('TeacherDashBoard');
          else if (type === 'Student') navigation.replace('StudentDashBoard');
          return;
        }
      }

      Alert.alert('Access Denied', 'You do not have the required permissions.');
    } catch (error) {
      console.log(error);
      Alert.alert('Invalid Credentials', 'Please enter correct credentials.');
    } finally {
      setLoading(false);
    }
  };

  

  const handleLogin = async () => {
    if (!validateInput(email, password)) return;

    setLoading(true);

    try {
      const type = selectedId === '1' ? 'Student' : selectedId === '2' ? 'Teacher' : 'Admin';
      await checkAdminAccess(email.toLowerCase(), type, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{justifyContent:'center'}}>
          <LottieView style={styles.image} source={require('../assets/LoginAnimation.json')} autoPlay />
          <Text style={styles.loginText}>Login</Text>
          <ScrollView>
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Email ID"
                value={email}
                activeOutlineColor={Colors.PRIMARY}
                mode="outlined"
                contentStyle={styles.textInputContent}
                activeUnderlineColor={Colors.PRIMARY}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                left={
                  <TextInput.Icon
                    icon="email-outline"
                    size={24}
                    style={styles.iconStyle}
                  />
                }
                right={
                  email.length > 0 && (
                    <TextInput.Icon
                      icon="close-circle"
                      size={24}
                      style={styles.iconStyle}
                      onPress={() => setEmail('')}
                    />
                  )
                }
              />
            </View>
            <Divider />
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                secureTextEntry={!showPassword}
                activeOutlineColor={Colors.PRIMARY}
                mode="outlined"
                contentStyle={styles.textInputContent}
                activeUnderlineColor={Colors.PRIMARY}
                value={password}
                onChangeText={setPassword}
                right={
                  <TextInput.Icon
                    icon="eye"
                    size={24}
                    style={styles.iconStyle}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                left={
                  <TextInput.Icon
                    icon="lock-outline"
                    size={24}
                    style={styles.iconStyle}
                  />
                }
              />
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
            {loading ? (
              <ActivityIndicator size="small" color={"white"} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.signup}>
            New to EzMark App, {' '}
            <Text style={{ color: Colors.SECONDARY }}>Need Help?</Text>
          </Text>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
    fontFamily:'sans-serif',
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
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  textInputContent: {
    paddingVertical: 100,
  },
  iconStyle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: Colors.SECONDARY,
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
