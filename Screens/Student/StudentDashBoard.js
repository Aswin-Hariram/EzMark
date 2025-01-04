import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StudentMainDashboard from './StudentMainDashboard';
import StudentRequestHistory from './StudentRequestHistory';
import StudentProfile from './SProfile';
import { Colors } from '../../assets/Colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { ActivityIndicator } from 'react-native-paper';
const StudentDashBoard = () => {
    const Tab = createBottomTabNavigator();
    const [studentDetail, setStudentDetail] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    const getStudent = async () => {
        try {
            const user = auth.currentUser?.email;
            if (!user) {
                // Navigate to Login screen if user is not authenticated
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }], // Replace 'Login' with your actual login screen route name
                });
                return;
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
            setStudentDetail([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getStudent();
    }, []);

    const studentData = studentDetail[0];

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

                children={() => {
                    if (loading&&!studentData) {
                        return (
                            <View style={{width:'100%', height:'100%',justifyContent:'center',alignItems:'center',backgroundColor:'white'}}>
                                <LottieView source={require('../../assets/loadingPage.json')} autoPlay loop style={{width:'70%',height:100}} />
                            </View>
                        );
                    }
                    return <StudentMainDashboard studentDetail={studentData} />;
                }}
                options={{ tabBarLabel: 'Dashboard' }}
            />
            <Tab.Screen
                name="StudentRequestHistory"
                children={() => {
                    if (loading&&studentData) {
                        return <ActivityIndicator size="large" color={Colors.SECONDARY} />;
                    }
                    return <StudentRequestHistory studentDetail={studentData} />;
                }}
                options={{ tabBarLabel: 'Requests' }}
            />
            <Tab.Screen
                name="StudentProfile"
                children={() => (<StudentProfile student={studentData} />)}
                options={{ tabBarLabel: 'Profile' }}
            />
        </Tab.Navigator>
    );
};

export default StudentDashBoard;

const styles = StyleSheet.create({
    // Add any custom styles if needed
});
