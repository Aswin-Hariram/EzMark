import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import TeacherHistory from './TeacherHistory';
import TeacherProfile from '../Admin/TeacherProfile';
import { Colors } from '../../assets/Colors';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ActivityIndicator, FAB } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import MainDashboard from './MainDashboard';

const Dashboard = ({ teacherDetail }) => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
   
      <MainDashboard />
      <FAB
        icon="plus"
        color="white"
        style={styles.fab}
        onPress={() => {
          navigation.navigate("CreateRequest", { teacherDetail: teacherDetail });
        }}
      />
    </SafeAreaView>
  );
};

const TeacherDashBoard = () => {
  const Tab = createBottomTabNavigator();
  const [teacherDetail, setTeacherDetail] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTeacher = async () => {
    try {
      setLoading(true); // Ensure loading state is set when fetching starts
      const user = auth.currentUser?.email;
      if (!user) {
        throw new Error('User is not authenticated.');
      }

      const q = query(
        collection(firestore, 'UserData'),
        where('email', '==', user),
        where('type', '==', 'Teacher')
      );
      const documents = await getDocs(q);

      const temp = [];
      documents.forEach((doc) => temp.push({ id: doc.id, ...doc.data() }));
      setTeacherDetail(temp);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setTeacherDetail([]); // Clear data on error
    } finally {
      setLoading(false); // Ensure loading is stopped
    }
  };

  useEffect(() => {
    getTeacher();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color={Colors.SECONDARY} />
        <Text style={styles.loadingText}>Loading Teacher Data...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'TeacherHistory':
              iconName = 'history';
              break;
            case 'TeacherProfile':
              iconName = 'person';
              break;
            default:
              iconName = 'help-outline';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.SECONDARY,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard">
        {() => <Dashboard teacherDetail={teacherDetail[0]} />}
      </Tab.Screen>
      <Tab.Screen name="TeacherHistory" children={() =>  <TeacherHistory teacherDetail={teacherDetail[0]} /> } />
      <Tab.Screen name="TeacherProfile">
        {() => <TeacherProfile teacher1={teacherDetail[0]} getTeachers1={getTeacher} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default TeacherDashBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 5,
    bottom: 5,
    backgroundColor: Colors.SECONDARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: 'gray',
  },
});
