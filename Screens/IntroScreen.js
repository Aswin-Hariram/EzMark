import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import LottieView from 'lottie-react-native';
import { auth } from '../Config/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IntroScreen = ({ navigation }) => {
  const [nxtRoute, setNxtRoute] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User is signed in');
        try {
          const userType = await AsyncStorage.getItem('userType');
          console.log("userType:", userType);
          if (userType === 'Admin') {
            setNxtRoute('AdminDashboardScreen');
          } else if (userType === 'Teacher') {
            setNxtRoute('TeacherDashBoard');
          } else if (userType === 'Student') {
            setNxtRoute('StudentDashBoard');
          } else {
            setNxtRoute('Login');
          }
        } catch (error) {
          console.error('Error fetching user type from AsyncStorage:', error);
          setNxtRoute('Login');
        }
      } else {
        console.log('No user is signed in');
        setNxtRoute('Login');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (nxtRoute) {
      const timer = setTimeout(() => {
        console.log('Navigating to:', nxtRoute);
        navigation.replace(nxtRoute);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [nxtRoute, navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        style={styles.lottie}
        source={require('./Animation/LoginAnimation.json')}
        autoPlay
        loop
      />
      <Text style={styles.title}>Welcome to EzMark</Text>
      <View style={styles.phraseContainer}>
        <Text style={styles.subtitle}>Quick, easy, and fun attendance!</Text>
      </View>
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  lottie: {
    width: 400,
    height: 400,
  },
  title: {
    fontSize: 32,
    color: '#3b5998',
    fontWeight: 'bold',
    marginTop: -40,
  },
  phraseContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555',
    marginVertical: 2,
  },
});
