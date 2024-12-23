import React from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View, FlatList } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Sample data for recent attendance activities
const recentAttendanceData = [
    { id: '1', className: 'Class 1A', subject: 'Maths', date: '2024-12-22', percentage: '95%' },
    { id: '2', className: 'Class 2B', subject: 'Science', date: '2024-12-21', percentage: '88%' },
    { id: '3', className: 'Class 3C', subject: 'English', date: '2024-12-20', percentage: '92%' },
    { id: '4', className: 'Class 4D', subject: 'History', date: '2024-12-19', percentage: '85%' },
];

// Create Bottom Tab Navigator instance
const Tab = createBottomTabNavigator(); // Declare Tab navigator here

const Dashboard = () => {
   

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={recentAttendanceData}
                ListHeaderComponent={() => (
                    <>
                        {/* Greeting Section */}
                        

                        {/* Overview Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Overview</Text>
                            <View style={styles.cardsRow}>
                                <View style={styles.card}>
                                    <Icon name="class" size={30} color="#fff" style={styles.cardIcon} />
                                    <Text style={styles.cardTitle}>Classes</Text>
                                    <Text style={styles.cardValue}>20</Text>
                                </View>
                                <View style={styles.card}>
                                    <Icon name="person" size={30} color="#fff" style={styles.cardIcon} />
                                    <Text style={styles.cardTitle}>Students</Text>
                                    <Text style={styles.cardValue}>200</Text>
                                </View>
                            </View>
                            <View style={styles.cardsRow}>
                                <View style={styles.card}>
                                    <Icon name="school" size={30} color="#fff" style={styles.cardIcon} />
                                    <Text style={styles.cardTitle}>Teachers</Text>
                                    <Text style={styles.cardValue}>15</Text>
                                </View>
                                <View style={styles.card}>
                                    <Icon name="book" size={30} color="#fff" style={styles.cardIcon} />
                                    <Text style={styles.cardTitle}>Subjects</Text>
                                    <Text style={styles.cardValue}>10</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.sectionTitle}>Recent Activities</Text>
                    </>
                )}
                renderItem={({ item }) => (
                    <View style={styles.attendanceCard}>
                        <Text style={styles.attendanceClass}>{item.className} - {item.subject}</Text>
                        <Text style={styles.attendanceDate}>{item.date}</Text>
                        <Text style={styles.attendancePercentage}>Attendance: {item.percentage}</Text>
                    </View>
                )}
                keyExtractor={(item) => item.id}
            />
        </SafeAreaView>
    );
};

const ManageTeachers = () => (
    <View style={styles.centered}>
        <Text>Manage Teachers Screen</Text>
    </View>
);

const Reports = () => (
    <View style={styles.centered}>
        <Text>Reports Screen</Text>
    </View>
);

const Classes = () => (
    <View style={styles.centered}>
        <Text>Manage Classes Screen</Text>
    </View>
);

const AdminDashboardScreen = () => {
    return (
      
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {
                        let iconName;

                        if (route.name === 'Dashboard') {
                            iconName = 'dashboard';
                        } else if (route.name === 'Manage Teachers') {
                            iconName = 'people';
                        } else if (route.name === 'Reports') {
                            iconName = 'bar-chart';
                        } else if (route.name === 'Classes') {
                            iconName = 'class';
                        }

                        return <Icon name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#007bff',
                    tabBarInactiveTintColor: 'gray',
                })}
            >
                <Tab.Screen name="Dashboard" component={Dashboard} />
                <Tab.Screen name="Manage Teachers" component={ManageTeachers} />
                <Tab.Screen name="Reports" component={Reports} />
                <Tab.Screen name="Classes" component={Classes} />
            </Tab.Navigator>
      
    );
};

export default AdminDashboardScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Platform.OS === 'android' ? 25 : 15, // Adjust padding for iOS and Android
        backgroundColor: '#f8f9fa',
    },
    greetingSection: {
       
    },
    greetingTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Arial', // Example font family
    },
    greetingDate: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'Arial', // Example font family
    },
    section: {
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    card: {
        flex: 1,
        backgroundColor: '#429EA6',
        padding: 20,
        margin: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
    },
    cardIcon: {
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 5,
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    attendanceCard: {
        backgroundColor: '#fff',
        padding: 15,
        margin: Platform.OS === 'android' ? 10 : 15, // Adjust vertical margin for iOS
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    attendanceClass: {
        fontSize: 16,
        fontWeight: '700', // Increased weight for emphasis
        color: '#333',
    },
    attendanceDate: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    attendancePercentage: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28a745',
        marginTop: 5,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});