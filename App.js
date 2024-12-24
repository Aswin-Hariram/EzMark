import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Screens/HomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './Screens/LoginScreen';
import { HeaderTitle } from '@react-navigation/elements';
import AdminDashboardScreen from './Screens/AdminDashboardScreen';
import ManageTeachers from './Screens/ManageTeachers';
import TeacherProfile from './Screens/TeacherProfile';
import { useFonts } from 'expo-font';
import fonts from './assets/Signika.ttf';
import fonts1 from './assets/Fonts/Metrophobic-Regular.ttf';
import { Text } from 'react-native';
import StudentProfile from './Screens/StudentProfile';
import ClassScreen from './Screens/ClassScreen';
import AddTeacher from './Screens/AddTeacher';
import ManageStudents from './Screens/ManageStudents';
import AddStudent from './Screens/AddStudent';

export default function App() {
  const [loaded, error] = useFonts({
    'Signika': fonts,
    'Metro':fonts1
  });

  if (!loaded) {
    return <Text>Loading...</Text>; // Display loading screen until the font is loaded
  }

  const Stack = createNativeStackNavigator();

  

  function RootStack() {
    return (
      <Stack.Navigator initialRouteName='Login' screenOptions={{headerShown:false}}>
       <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen}/>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ManageTeacher" component={ManageTeachers}/>
        <Stack.Screen name="TeacherProfile" component={TeacherProfile}/>
        <Stack.Screen name="StudentProfile" component={StudentProfile}/>
        <Stack.Screen name="ClassScreen" component={ClassScreen}/>
        <Stack.Screen name="AddTeacher" component={AddTeacher}/>
        <Stack.Screen name="ManageStudent" component={ManageStudents}/>
        <Stack.Screen name='AddStudent' component={AddStudent}/>
      </Stack.Navigator>
    );
  }
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

