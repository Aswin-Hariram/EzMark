import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StudentMainDashboard from './StudentMainDashboard';
import StudentRequestHistory from './StudentRequestHistory';
import StudentProfile from './StudentProfile';
import { Colors } from '../../assets/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import { auth, firestore } from '../../Config/FirebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const StudentDashBoard = () => {

    const Tab = createBottomTabNavigator();
    const [studentDetail, setStudentDetail] = useState([]);
    const [loading, setLoading] = useState(true); // Added loading state

    const getStudent = async () => {
        try {
            const user = auth.currentUser?.email;
            if (!user) {
                throw new Error('User is not authenticated.');
            }

            const q = query(
                collection(firestore, 'UserData'),
                where('email', '==', user),
                where('type', '==', 'Student')
            );
            const documents = await getDocs(q);

            const temp = [];
            documents.forEach((doc) => temp.push({ id: doc.id, ...doc.data() }));
            setStudentDetail(temp);
        } catch (error) {
            console.error('Error fetching student data:', error);
            setStudentDetail([]); // Clear data on error
        } finally {
            setLoading(false); // Stop loading when data is fetched
        }
    };

    useEffect(() => {
        getStudent();
    }, []); // Empty dependency array to call it once on mount

    // Check if student detail is available before passing to child
    const studentData = studentDetail[0];
    console.log(studentData)
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'StudentMainDashboard') {
                        iconName = 'dashboard';
                    } else if (route.name === 'StudentRequestHistory') {
                        iconName = 'notifications';
                    } else if (route.name === 'StudentProfile') {
                        iconName = 'person';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.SECONDARY,
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen
                name="StudentMainDashboard"
                component={StudentMainDashboard}
                options={{ tabBarLabel: 'Dashboard' }}
            />
            <Tab.Screen
                name="StudentRequestHistory"
                // Pass student data as params to the StudentRequestHistory screen
                children={() => {
                    if (loading) {
                        return <ActivityIndicator size="large" color={Colors.SECONDARY} />; // Show loading spinner while fetching data
                    }
                    return <StudentRequestHistory studentDetail={studentData} />;
                }}
                options={{ tabBarLabel: 'History' }}
            />
            <Tab.Screen
                name="StudentProfile"
                component={StudentProfile}
                options={{ tabBarLabel: 'Profile' }}
            />
        </Tab.Navigator>
    );
};

export default StudentDashBoard;

const styles = StyleSheet.create({
    // Add any custom styles if needed
});
