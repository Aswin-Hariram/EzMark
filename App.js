import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Text, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Screens
import LoginScreen from './Screens/LoginScreen';
import AdminDashboardScreen from './Screens/Admin/AdminDashboardScreen';
import ManageTeachers from './Screens/Admin/ManageTeachers';
import TeacherProfile from './Screens/Admin/TeacherProfile';
import StudentProfile from './Screens/Admin/StudentProfile';
import ClassScreen from './Screens/Admin/ClassScreen';
import AddTeacher from './Screens/Admin/AddTeacher';
import ManageStudents from './Screens/Admin/ManageStudents';
import AddStudent from './Screens/Admin/AddStudent';
import StudentDashBoard from './Screens/Student/StudentDashBoard';
import TeacherDashBoard from './Screens/Teacher/TeacherDashBoard';
import AddClass from './Screens/Admin/AddClass';
import CreateRequest from './Screens/Teacher/CreateRequest';
import RequestDetails from './Screens/Teacher/RequestDetails';
import VerificationScreen from './Screens/Student/VerificationScreen';
import TProfile from './Screens/Teacher/TProfile';
import IntroScreen from './Screens/IntroScreen';
import ClassSummary from './Screens/Teacher/ClassSummary';

// Import assets
import SignikaFont from './assets/Signika.ttf';
import MetrophobicFont from './assets/Fonts/Metrophobic-Regular.ttf';
import { Colors } from './assets/Colors';

export default function App() {
  // Font loading
  const [fontsLoaded, error] = useFonts({
    Signika: SignikaFont,
    Metro: MetrophobicFont,
  });

  // State for app initialization/loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        // Any other initialization logic here
        console.log('User data:', userData);
      } catch (err) {
        console.error('Error during app initialization:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (error) {
    console.error('Error loading fonts:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading fonts</Text>
      </View>
    );
  }

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size={50} color={Colors.PRIMARY} />
      </View>
    );
  }

  const Stack = createNativeStackNavigator();

  const RootStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IntroScreen" component={IntroScreen} />
      <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ManageTeacher" component={ManageTeachers} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfile} />
      <Stack.Screen name="StudentProfile" component={StudentProfile} />
      <Stack.Screen name="ClassScreen" component={ClassScreen} />
      <Stack.Screen name="AddTeacher" component={AddTeacher} />
      <Stack.Screen name="ManageStudent" component={ManageStudents} />
      <Stack.Screen name="AddStudent" component={AddStudent} />
      <Stack.Screen name="StudentDashBoard" component={StudentDashBoard} />
      <Stack.Screen name="TeacherDashBoard" component={TeacherDashBoard} />
      <Stack.Screen name="AddClass" component={AddClass} />
      <Stack.Screen name="CreateRequest" component={CreateRequest} />
      <Stack.Screen name="RequestDetails" component={RequestDetails} />
      <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
      <Stack.Screen name="TProfile" component={TProfile} />
      <Stack.Screen name="ClassSummary" component={ClassSummary} />
    </Stack.Navigator>
  );

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" />
      <RootStack />
    </NavigationContainer>
  );
}
