import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, SafeAreaView, ScrollView } from 'react-native';
import React, { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { Colors } from '../assets/Colors';
import Entypo from '@expo/vector-icons/Entypo';

const ManageTeachers = () => {
    const [Teachers, setTeachers] = useState([
        { id: '1', profile: require('../assets/Teachers/profile.png'), Name: "Gowtham", Department: "CSE" },
        { id: '2', profile: require('../assets/Teachers/woman.png'), Name: "Jane", Department: "ECE" },
        { id: '3', profile: require('../assets/Teachers/profile.png'), Name: "John", Department: "EEE" },
        { id: '4', profile: require('../assets/Teachers/woman.png'), Name: "Doe", Department: "MECH" },
        { id: '5', profile: require('../assets/Teachers/profile.png'), Name: "Gowtham", Department: "CSE" },
        { id: '6', profile: require('../assets/Teachers/woman.png'), Name: "Jane", Department: "ECE" },
        { id: '7', profile: require('../assets/Teachers/profile.png'), Name: "John", Department: "EEE" },
        { id: '8', profile: require('../assets/Teachers/woman.png'), Name: "Doe", Department: "MECH" },
        { id: '9', profile: require('../assets/Teachers/profile.png'), Name: "Gowtham", Department: "CSE" },
        { id: '10', profile: require('../assets/Teachers/woman.png'), Name: "Jane", Department: "ECE" },
        { id: '11', profile: require('../assets/Teachers/profile.png'), Name: "John", Department: "EEE" },
        { id: '12', profile: require('../assets/Teachers/woman.png'), Name: "Doe", Department: "MECH" },
    ]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.search}>
                <TextInput style={styles.input} placeholder="Search Teachers" inputMode='search' cursorColor={Colors.SECONDARY} />
                <Feather style={{ marginRight: 5 }} name="search" size={22} color={Colors.SECONDARY} />
            </View>

            {/* Wrapping FlatList in ScrollView for better scrolling on large lists */}
       
                <FlatList style={{ marginTop: 13 }}
                    data={Teachers}
                    renderItem={({ item }) =>
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
                    }
                    keyExtractor={item => item.id}
                />
            

            <TouchableOpacity style={styles.floating_btn} activeOpacity={0.7}>
                <Entypo name="plus" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

export default ManageTeachers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5', // To ensure SafeAreaView doesn't take the background color of the parent
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
        alignItems: 'center',
    },
    profile_img: {
        width: 50,
        height: 50,
        borderRadius: 25, // Rounded for better design
    },
    rightClick: {
        width: 30,
        height: 30,
    },
    info: {
        marginRight: 100,
        justifyContent: 'center',
    },
    teacherName: {
        fontSize: 16,
        fontWeight: 'heavy',
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
        borderRadius: 30, // More rounded for iOS style
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 4,
    },
    floating_txt: {
        color: 'white',
        fontSize: 30,

        textAlign: 'center',
    },
    search: {
        backgroundColor: 'white',
        marginTop: Platform.OS === 'ios' ? 20 : 40, // Adjust top margin for iOS
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
        width: '100%',
        height: '100%',
        fontSize: 16,
        marginRight: 10,
        cursor: 'text',
        

    },
    srh_img: {
        width: 18,
        height: 18,
        position: 'absolute',
        top: 18,
        left: 10,
    },
    
});
