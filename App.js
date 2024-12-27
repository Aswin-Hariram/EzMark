import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Screens/HomeScreen';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import LoginScreen from './Screens/LoginScreen';
import { HeaderTitle } from '@react-navigation/elements';
import AdminDashboardScreen from './Screens/Admin/AdminDashboardScreen';
import ManageTeachers from './Screens/Admin/ManageTeachers';
import TeacherProfile from './Screens/Admin/TeacherProfile';
import { useFonts } from 'expo-font';
import fonts from './assets/Signika.ttf';
import fonts1 from './assets/Fonts/Metrophobic-Regular.ttf';
import { Text } from 'react-native';
import StudentProfile from './Screens/Admin/StudentProfile';
import ClassScreen from './Screens/Admin/ClassScreen';
import AddTeacher from './Screens/Admin/AddTeacher';
import ManageStudents from './Screens/Admin/ManageStudents';
import AddStudent from './Screens/Admin/AddStudent';
import { useEffect, useState } from 'react';
import { auth } from './Config/FirebaseConfig';
import { ActivityIndicator } from 'react-native-paper';
import { Colors } from './assets/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StudentDashBoard from './Screens/Student/StudentDashBoard';
import TeacherDashBoard from './Screens/Teacher/TeacherDashBoard';
import AddClass from './Screens/Admin/AddClass';
import CreateRequest from './Screens/Teacher/CreateRequest';
import RequestDetails from './Screens/Teacher/RequestDetails';

export default function App() {
  const [loaded, error] = useFonts({
    'Signika': fonts,
    'Metro': fonts1
  });
  const [loading, setLoading] = useState(false);
  const [initialRoute, setinitialRoute] = useState('Login')

  if (!loaded) {
    return <Text>Loading...</Text>; // Display loading screen until the font is loaded
  }
  if (loading) {
    return <ActivityIndicator size={50} color={Colors.PRIMARY} />
  }

  const Stack = createNativeStackNavigator();


  function RootStack() {

    useEffect(() => {
      const checker = auth.onAuthStateChanged(async (user) => {
        if (user) {
          console.log('User is signed in');
          try {
            const userType = await AsyncStorage.getItem('userType');
            console.log("userType",userType);
            if (userType === 'Admin') {
              setinitialRoute('AdminDashboardScreen');
            }
            else if (userType === 'Teacher') {
              setinitialRoute('TeacherDashBoard');
            }
          } catch (error) {
            console.error('Error fetching user type from AsyncStorage:', error);
          }
        } else {
          console.log('User is not signed in');
          setinitialRoute('Login');
        }
        setLoading(false); // Ensure loading is set to false after the async call
      });

      // Clean up the subscription when the component unmounts
      return () => checker();
    }, []);


    return (


      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ManageTeacher" component={ManageTeachers} />
        <Stack.Screen name="TeacherProfile" component={TeacherProfile} />
        <Stack.Screen name="StudentProfile" component={StudentProfile} />
        <Stack.Screen name="ClassScreen" component={ClassScreen} />
        <Stack.Screen name="AddTeacher" component={AddTeacher} />
        <Stack.Screen name="ManageStudent" component={ManageStudents} />
        <Stack.Screen name='AddStudent' component={AddStudent} />
        <Stack.Screen name='StudentDashBoard' component={StudentDashBoard} />
        <Stack.Screen name='TeacherDashBoard' component={TeacherDashBoard} />
        <Stack.Screen name='AddClass' component={AddClass} />
        <Stack.Screen name='CreateRequest' component={CreateRequest} />
        <Stack.Screen name='RequestDetails' component={RequestDetails} />
      </Stack.Navigator>
    );
  }
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

