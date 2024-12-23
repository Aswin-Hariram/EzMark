import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { Colors } from '../assets/Colors';
import { useNavigation } from '@react-navigation/native';

const ManageClasses = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [Classes, setClasses] = useState([
        { id: '1', ClassName: 'Class 1A', Teacher: 'Mr. Smith' },
        { id: '2', ClassName: 'Class 2B', Teacher: 'Mrs. Johnson' },
        { id: '3', ClassName: 'Class 3C', Teacher: 'Ms. Clark' },
        { id: '4', ClassName: 'Class 4D', Teacher: 'Mr. Taylor' },
        { id: '5', ClassName: 'Class 5E', Teacher: 'Ms. Lee' },
        { id: '6', ClassName: 'Class 6F', Teacher: 'Mrs. Brown' },
    ]);

    const filteredClasses = Classes.filter(
        (cls) =>
            cls.ClassName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cls.Teacher.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Bar */}
            <View style={styles.search}>
                <TextInput
                    style={styles.input}
                    placeholder="Search Classes"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    cursorColor={Colors.SECONDARY}
                />
                <Feather style={{ marginRight: 5 }} name="search" size={22} color={Colors.SECONDARY} />
            </View>

            {/* Classes List */}
            {filteredClasses.length > 0 ? (
                <FlatList
                    style={{ marginTop: 13 }}
                    data={filteredClasses}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.classCard}
                        onPress={()=>{navigation.navigate("ClassScreen")}}>
                            <View style={styles.info}>
                                <Text style={styles.className}>{item.ClassName}</Text>
                                <Text style={styles.teacherName}>Teacher: {item.Teacher}</Text>
                            </View>
                            <TouchableOpacity style={styles.btn} activeOpacity={0.7}>
                                <Entypo name="chevron-right" size={24} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.id}
                />
            ) : (
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ color: Colors.SECONDARY, fontSize: 16 }}>No classes found</Text>
                </View>
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.floating_btn}
                activeOpacity={0.7}
                accessibilityLabel="Add Class"
                onPress={() => {
                    console.log('Add Class button clicked');
                }}
            >
                <Entypo name="plus" size={24} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default ManageClasses;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    classCard: {
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
    info: {
        marginLeft: 10,
        flex: 1,
        justifyContent: 'center',
    },
    className: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        fontFamily: 'Signika',
    },
    teacherName: {
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
