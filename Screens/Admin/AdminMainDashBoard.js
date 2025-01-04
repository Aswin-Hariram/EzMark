import React, { useEffect, useState, useCallback } from 'react';
import { Platform, SafeAreaView, StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { collection, getDocs, doc, getDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { Colors } from '../../assets/Colors';
import { useNavigation } from '@react-navigation/native';


const AdminMainDashBoard = () => {
    const [students, setStudents] = useState([]);
    const [teacher, setTeacher] = useState([]);
    const [classes, setClasses] = useState({});
    const [subjects, setSubjects] = useState({});
    const navigation = useNavigation();
    const [recentActivities, setRecentActivities] = useState();

    const fetchUserData = useCallback(async () => {
        try {
            const ref = collection(firestore, "UserData");
            const docSnap = await getDocs(ref);
            if (docSnap.empty) {
                console.log("No data found");
                return;
            }
            docSnap.forEach(doc => {
                const data = doc.data();
                if (data.type === "Student") {
                    setStudents(prevState => [...prevState, data]);
                }
                if (data.type === "Teacher") {
                    setTeacher(prevState => [...prevState, data]);
                }
            });
        } catch (e) {
            console.log(e.message);
        }
    }, []);

    const fetchClassAndSubjects = useCallback(async () => {
        try {
            const ref = doc(firestore, "BasicData", "Data");
            const docSnap = await getDoc(ref);
            if (!docSnap.exists()) {
                console.log("No data found");
                throw new Error("No data found");
            }
            const data = docSnap.data();
            console.log("Data=>", data);
            setClasses(data.Class);
            setSubjects(data.Subjects);

        } catch (e) {
            console.log(e.message);
        }
    }, []);

    const fetchRecentActivities = useCallback(() => {
        try {
            const ref = collection(firestore, "UserData");

            // Query to get documents ordered by timestamp
            const q = query(ref, orderBy("id", "desc"), limit(5)); // Get the last 10 updates

            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (snapshot.empty) {
                    console.log("No recent activities");
                    setRecentActivities([]); // Set empty array if no data
                    return;
                }

                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setRecentActivities(activities);
                console.log("Recent activities=>", activities);
            });

            // Cleanup function to unsubscribe from listener when component is unmounted
            return () => unsubscribe();
        } catch (e) {
            console.log(e.message);
        }
    }, []);

    useEffect(() => {
        fetchUserData();
        fetchClassAndSubjects();
        fetchRecentActivities();
    }, [fetchUserData, fetchClassAndSubjects, fetchRecentActivities]);


    const renderHeader = () => (

        <View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.cardsRow}>
                    <View style={styles.card}>
                        <Icon name="class" size={30} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Classes</Text>
                        <Text style={styles.cardValue}>{classes.length || 0}</Text>
                    </View>
                    <View style={styles.card}>
                        <Icon name="book" size={30} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Subjects</Text>
                        <Text style={styles.cardValue}>{subjects.length || 0}</Text>
                    </View>
                </View>
                <View style={styles.cardsRow}>
                    <TouchableOpacity style={styles.card} onPress={() => { navigation.navigate("Teachers"); }} >
                        <Icon name="school" size={30} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Teachers</Text>
                        <Text style={styles.cardValue}>{teacher.length || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.card} onPress={() => { navigation.navigate("Students"); }}>
                        <Icon name="person" size={30} color="#fff" style={styles.cardIcon} />
                        <Text style={styles.cardTitle}>Students</Text>
                        <Text style={styles.cardValue}>{students.length || 0}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <Text style={styles.sectionTitle}>Recent Activities</Text>
        </View>

    )
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity>
                    <Feather name="menu" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>EzMark</Text>
                <TouchableOpacity onPress={() => {
                    Alert.alert("Logout", "Are you sure you want to logout?", [
                        {
                            text: "No",
                            onPress: () => console.log("Cancel Pressed"),
                        }, {
                            text: "Yes",
                            onPress: () => {
                                auth.signOut()
                                    .then(() => {
                                        navigation.reset({
                                            index: 0,
                                            routes: [{ name: 'Login' }],
                                        })
                                    });
                            }
                        }
                    ], { cancelable: true });
                }}>
                    <MaterialIcons name="logout" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <FlatList
                showsVerticalScrollIndicator={false}
                data={recentActivities}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <View style={{ ...styles.attendanceCard, flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                            style={styles.profileImage}
                            source={item.image ? { uri: item.image } : require('../../assets/Teachers/profile.png')} // Fallback in case the image fails to load
                        />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.attendanceClass}>{item.name} {item.class && <Text style={styles.classTxt}> - {item.class}</Text>} </Text>
                            {item.rollno ?
                                <Text style={styles.attendanceDepartment}>Roll no: {item.rollno}</Text> :
                                <Text style={styles.attendanceDepartment}>Email: {item.email}</Text>
                            }
                            <Text style={styles.attendanceDepartment}>Department: {item.department}</Text>
                        </View>
                    </View>
                )}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }}>
                        <Text style={{ marginTop: 100 }}>No recent activities</Text>
                    </View>}
            />
        </SafeAreaView>
    );
};

export default AdminMainDashBoard;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingTop: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.SECONDARY,
        marginBottom: 5,
        marginLeft: 10,
    },
    profileImage: {
        width: 65,
        height: 65,
        borderRadius: 50,
    },
    cardsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    card: {
        flex: 1,
        backgroundColor: Colors.SECONDARY,
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
        marginHorizontal: 10,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#3333',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    attendanceClass: {
        fontSize: 18,
        fontWeight: '400',
        color: '#333',
        fontFamily: 'Signika-regular',
    },
    classTxt: {
        fontSize: 16,
        color: '#333',
    },
    attendanceDepartment: {
        fontSize: 14,
        color: Colors.SECONDARY,
        marginTop: 5,
    },
    attendancePercentage: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#28a745',
        marginTop: 5,
    },
});
