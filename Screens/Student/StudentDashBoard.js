import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { ActivityIndicator } from 'react-native-paper';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import StudentMainDashboard from './StudentMainDashboard';
import StudentRequestHistory from './StudentRequestHistory';
import StudentProfile from './SProfile';
import { Colors } from '../../assets/Colors';
import { auth, firestore } from '../../Config/FirebaseConfig';

const Tab = createBottomTabNavigator();

const StudentDashBoard = () => {
  const [studentDetail, setStudentDetail] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const getStudent = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser?.email;

      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const studentQuery = query(
        collection(firestore, 'UserData'),
        where('email', '==', user),
        where('type', '==', 'Student')
      );

      const documents = await getDocs(studentQuery);
      const records = documents.docs.map((item) => ({ id: item.id, ...item.data() }));
      setStudentDetail(records);
    } catch (error) {
      console.log('Error fetching student data:', error);
      setStudentDetail([]);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    getStudent();
  }, [getStudent]);

  const studentData = studentDetail[0];

  if (loading) {
    return (
      <View style={styles.loadingShell}>
        <LottieView source={require('../../assets/loadingPage.json')} autoPlay loop style={styles.loadingAnimation} />
        <Text style={styles.loadingText}>Preparing your student workspace...</Text>
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.loadingShell}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Student profile unavailable.</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'space-dashboard',
            Requests: 'event-note',
            Profile: 'account-circle',
          };

          return <Icon name={icons[route.name] || 'help-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: '#7B8A97',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 0,
          backgroundColor: '#FFFFFF',
        },
        sceneStyle: {
          backgroundColor: '#EFF4F8',
        },
      })}
    >
      <Tab.Screen name="Dashboard">
        {() => <StudentMainDashboard studentDetail={studentData} />}
      </Tab.Screen>
      <Tab.Screen name="Requests">
        {() => <StudentRequestHistory studentDetail={studentData} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <StudentProfile student={studentData} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF4F8',
    paddingHorizontal: 24,
  },
  loadingAnimation: {
    width: '72%',
    height: 120,
  },
  loadingText: {
    marginTop: 14,
    color: '#6B7C8C',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StudentDashBoard;
