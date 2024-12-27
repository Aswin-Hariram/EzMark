import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const StudentDashBoard = () => {

  const Tab = createBottomTabNavigator();
  return (
      
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
                let iconName;

                if (route.name === 'Dashboard') {
                    iconName = 'dashboard';
                } else if (route.name === 'Notification') {
                    iconName = 'notification';
                } else if (route.name === 'History') {
                    iconName = 'history';
                } else if (route.name === 'Profile') {
                    iconName = 'person';
                }

                return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: Colors.SECONDARY,
            tabBarInactiveTintColor: 'gray',
        })}
    >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="Notification" component={ManageTeachers} />
        <Tab.Screen name="History" component={ManageStudents} />
        <Tab.Screen name="Profile" component={ManageClasses} />
    </Tab.Navigator>

);
}

export default StudentDashBoard

const styles = StyleSheet.create({})