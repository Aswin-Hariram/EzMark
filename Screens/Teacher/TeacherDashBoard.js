import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ActivityIndicator } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { auth, firestore } from '../../Config/FirebaseConfig';
import MainDashboard from './MainDashboard';
import TeacherHistory from './TeacherHistory';
import TProfile from './TProfile';

const Tab = createBottomTabNavigator();

const TeacherDashBoard = () => {
  const [teacherDetail, setTeacherDetail] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTeacher = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser?.email;

      if (!user) {
        throw new Error('User is not authenticated.');
      }

      const teacherQuery = query(
        collection(firestore, 'UserData'),
        where('email', '==', user),
        where('type', '==', 'Teacher')
      );

      const documents = await getDocs(teacherQuery);
      const records = documents.docs.map((item) => ({ id: item.id, ...item.data() }));
      setTeacherDetail(records);
    } catch (error) {
      console.log('Error fetching teacher data:', error);
      setTeacherDetail([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    getTeacher();
  }, [getTeacher]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading teacher workspace...</Text>
      </View>
    );
  }

  const currentTeacher = teacherDetail[0];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'space-dashboard',
            Requests: 'fact-check',
            Profile: 'badge',
          };

          return <MaterialIcons name={icons[route.name] || 'help-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: '#7C8A97',
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
          backgroundColor: '#F4F7FB',
        },
      })}
    >
      <Tab.Screen name="Dashboard">
        {() => <MainDashboard teacherDetail={currentTeacher} />}
      </Tab.Screen>
      <Tab.Screen name="Requests">
        {() => <TeacherHistory teacherDetail={currentTeacher} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {() => <TProfile teacher1={currentTeacher} getTeachers1={getTeacher} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6C7B88',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TeacherDashBoard;
