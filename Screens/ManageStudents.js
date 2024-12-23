import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { Colors } from '../assets/Colors';

const ManageStudents = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [Students, setStudents] = useState([
        { id: '1', profile: require('../assets/Teachers/profile.png'), Name: 'Gowtham', Department: 'CSE' },
        { id: '2', profile: require('../assets/Teachers/woman.png'), Name: 'Jane', Department: 'ECE' },
        { id: '3', profile: require('../assets/Teachers/profile.png'), Name: 'John', Department: 'EEE' },
        { id: '4', profile: require('../assets/Teachers/woman.png'), Name: 'Doe', Department: 'MECH' },
        { id: '5', profile: require('../assets/Teachers/profile.png'), Name: 'Gowtham', Department: 'CSE' },
        { id: '6', profile: require('../assets/Teachers/woman.png'), Name: 'Jane', Department: 'ECE' },
        { id: '7', profile: require('../assets/Teachers/profile.png'), Name: 'John', Department: 'EEE' },
        { id: '8', profile: require('../assets/Teachers/woman.png'), Name: 'Doe', Department: 'MECH' },
    ]);

    const filteredStudents = Students.filter(
        (teacher) =>
            teacher.Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            teacher.Department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.search}>
                <TextInput
                    style={styles.input}
                    placeholder="Search Students"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    cursorColor={Colors.SECONDARY}
                />
                <Feather style={{ marginRight: 5 }} name="search" size={22} color={Colors.SECONDARY} />
            </View>

            {/* Students List */}
            {filteredStudents.length > 0 ? (
                <FlatList
                    style={{ marginTop: 13 }}
                    data={filteredStudents}
                    renderItem={({ item }) => (
                        <View style={styles.teacherCard}>
                            <View style={styles.image}>
                                <Image style={styles.profile_img} source={item.profile} />
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.teacherName}>{item.Name}</Text>
                                <Text style={styles.teacherDept}>Department: {item.Department}</Text>
                            </View>
                            <TouchableOpacity style={styles.btn} activeOpacity={0.7}>
                                <Entypo name="chevron-right" size={24} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        </View>
                    )}
                    keyExtractor={(item) => item.id}
                />
            ) : (
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ color: Colors.SECONDARY, fontSize: 16 }}>No Students found</Text>
                </View>
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.floating_btn}
                activeOpacity={0.7}
                accessibilityLabel="Add Teacher"
                onPress={() => {
                    console.log('Add Teacher button clicked');
                }}
            >
                <Entypo name="plus" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ManageStudents;

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
        shadowColor: Platform.OS === 'ios' ? '#000' : 'rgba(0, 0, 0, 0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.5,
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
        fontFamily: 'Signika',
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
