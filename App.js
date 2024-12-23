import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Screens/HomeScreen';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from './Screens/LoginScreen';
import { HeaderTitle } from '@react-navigation/elements';
import AdminDashboardScreen from './Screens/AdminDashboardScreen';
import ManageTeachers from './Screens/ManageTeachers';
import TeacherProfile from './Screens/TeacherProfile';

export default function App() {


  const Stack = createNativeStackNavigator();

  function RootStack() {
    return (
      <Stack.Navigator initialRouteName='Login' screenOptions={{headerShown:false}}>
       <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen}/>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ManageTeacher" component={ManageTeachers}/>
        <Stack.Screen name="TeacherProfile" component={TeacherProfile}/>
      </Stack.Navigator>
    );
  }
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

