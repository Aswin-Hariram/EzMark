import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, SafeAreaView } from 'react-native';
import React, { useEffect, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import profilePic from '../../assets/Teachers/profile.png';
import { ActivityIndicator } from 'react-native-paper';

const ManageTeachers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [teachersData, setTeachersData] = useState([]);
    const [isRefreshing, setisRefreshing] = useState(false);
    const [isLoading, setisLoading] = useState(true)
    // Filter teachers based on the search query
    const filteredTeachers = teachersData.filter(
        (teacher) =>
            teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const navigation = useNavigation();

    const getTeachers = async () => {
        console.log('Fetching teachers from database');

        try {

            const q = query(collection(firestore, 'UserData'), where('type', '==', 'Teacher'));
            const querySnapshot = await getDocs(q);
            const teachers = []; // Temporary array to hold fetched teachers
            querySnapshot.forEach((doc) => {
                console.log(doc.id, ' => ', doc.data());
                teachers.push(doc.data()); // Add teacher data to the array
            });
            setTeachersData(teachers); // Set state with all fetched teachers
        } catch (error) {
            console.log('Error getting documents: ', error);
        }
        setisLoading(false)
    };
    useEffect(() => {

        getTeachers();
    }, []);

    if (isLoading) {
        return (<View style={{ flex: 1, justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size={'small'} color={Colors.PRIMARY} />
        </View>)
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.search}>
                <TextInput
                    style={styles.input}
                    placeholder="Search Teachers"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    cursorColor={Colors.SECONDARY}
                />
                <Feather style={{ marginRight: 5 }} name="search" size={22} color={Colors.SECONDARY} />
            </View>

            {/* Teachers List */}
            {filteredTeachers.length > 0 ? (
                <FlatList
                    style={{ marginTop: 13 }}
                    data={filteredTeachers}  // Use filteredTeachers instead of teachersData
                    keyExtractor={(item) => item.email}
                    refreshing={isRefreshing}
                    onRefresh={getTeachers}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.teacherCard}
                            onPress={() => navigation.navigate('TeacherProfile', { teacher: item })}
                        >
                            <View style={styles.image}>
                                <Image style={styles.profile_img} source={item.image ? item.image : profilePic} />
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.teacherName}>{item.name}</Text>
                                <Text style={styles.teacherDept}>Department: {item.department}</Text>
                            </View>
                            <Entypo name="chevron-right" size={24} color={Colors.PRIMARY} />
                        </TouchableOpacity>
                    )}
                />
            ) : (
                !isLoading && <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ color: Colors.SECONDARY, fontSize: 16 }}>No teachers found</Text>
                </View>
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.floating_btn}
                activeOpacity={0.7}
                accessibilityLabel="Add Teacher"
                onPress={() => {
                    navigation.navigate('AddTeacher');
                }}>
                <Entypo name="plus" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ManageTeachers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    teacherCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 10,
        backgroundColor: 'white',
        marginVertical: 5,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
    },
    profile_img: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    info: {
        marginLeft: 10,
        flex: 1,
        justifyContent: 'center',
    },
    teacherName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    teacherDept: {
        fontSize: 14,
        color: Colors.SECONDARY,
    },
    floating_btn: {
        backgroundColor: Colors.PRIMARY,
        position: 'absolute',
        width: 60,
        height: 60,
        bottom: 25,
        right: 25,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    search: {
        backgroundColor: 'white',
        marginTop: Platform.OS === 'ios' ? 20 : 40,
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Platform.OS === 'ios' ? 15 : 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    input: {
        flex: 1,
        fontSize: 16,
        marginRight: 10,
    },
});