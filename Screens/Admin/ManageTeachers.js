import { FlatList, Image, StyleSheet, Text, TextInput, TouchableWithoutFeedback, TouchableOpacity, View, Modal, Platform, SafeAreaView } from 'react-native';
import React, { useEffect, useState } from 'react';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo'
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import profilePic from '../../assets/Teachers/profile.png';
import { ActivityIndicator } from 'react-native-paper';
import { RadioButton } from 'react-native-paper';


const ManageTeachers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [teachersData, setTeachersData] = useState([]);
    const [isRefreshing, setisRefreshing] = useState(false);
    const [isLoading, setisLoading] = useState(true)
    const [modalVisible, setModalVisible] = useState(false);
    const [sortOption, setSortOption] = useState('Name(A-Z)');

    const [searchVisible, setSearchVisible] = useState(false);
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

    const applySort = (option) => {
        setSortOption(option);
        // Example sorting logic
        const sortedTeachers = [...teachersData];
        if (option === 'Name(A-Z)') {
            sortedTeachers.sort((a, b) => a.name.localeCompare(b.name));
        } else if (option === 'Name(Z-A)') {
            sortedTeachers.sort((a, b) => b.name.localeCompare(a.name));
        }
        setTeachersData(sortedTeachers);
        setModalVisible(false);
    };


    const renderModal = () => {
        const options = [
            { label: "Name(A-Z)", value: "Name(A-Z)" },
            { label: "Name(Z-A)", value: "Name(Z-A)" },
            { label: "Deparment", value: "Deparment" },

        ];

        return (
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Sort By</Text>
                                {options.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={styles.radioOption}
                                        onPress={() => applySort(option.value)}
                                    >
                                        <Text style={styles.optionText}>{option.label}</Text>
                                        <RadioButton
                                            color={Colors.SECONDARY}
                                            value={option.value}
                                            status={sortOption === option.value ? "checked" : "unchecked"}
                                            onPress={() => applySort(option.value)}
                                        />
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={styles.cancelButtonModal}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelTextModal}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <View style={styles.rightIcons}>
                    <TouchableOpacity style={styles.icon} onPress={() => { setSearchVisible(true) }} >
                        <Ionicons name="search-outline" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon} >
                        <AntDesign name="calendar" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon} onPress={() => { setModalVisible(true) }}>
                        <Ionicons name="filter-outline" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </View>

            </View>
            {/* Search Bar */}
            {
                searchVisible && <View style={styles.search}>
                    <TextInput
                        style={styles.input}
                        placeholder="Search Teachers"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        cursorColor={Colors.SECONDARY}
                    />
                    <TouchableOpacity onPress={() => { setSearchVisible(false) }}>
                        <Text style={styles.text}>Close</Text>
                    </TouchableOpacity>
                </View>
            }

            {/* Teachers List */}
            {filteredTeachers.length > 0 ? (
                <FlatList
                showsVerticalScrollIndicator={false}
                    style={{ marginTop: 13 }}
                    data={filteredTeachers}  // Use filteredTeachers instead of teachersData
                    keyExtractor={(item) => item.email}
                    refreshing={isRefreshing}
                    onRefresh={getTeachers}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.teacherCard}
                            onPress={() => navigation.navigate('TeacherProfile', { teacher: item, getTeachers: getTeachers })}
                        >
                            <View style={styles.image}>
                                <Image style={styles.profile_img} source={item.image ? { uri: item.image } : profilePic} />
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
                    navigation.navigate('AddTeacher', { getTeachers: getTeachers });
                }}>
                <Entypo name="plus" size={24} color="white" />
            </TouchableOpacity>
            {renderModal()}
        </SafeAreaView>
    );
};

export default ManageTeachers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    leftIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 4,
        color: Colors.PRIMARY,
        fontWeight:'bold',
        fontSize: 16,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 16,
    },
    teacherCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 10,
        backgroundColor: 'white',
        marginVertical: 5,
        marginHorizontal: 10,
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
        backgroundColor: Colors.SECONDARY,
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
        marginTop: 10,
        flexDirection: 'row',
        marginHorizontal: 10,
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
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginBottom: 15,
    },
    radioOption: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
        justifyContent: 'space-between',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.PRIMARY,
        marginRight: 10,
    },
    radioButtonSelected: {
        backgroundColor: Colors.PRIMARY,
    },
    optionText: {
        fontSize: 16,
    },
    applyButtonModal: {
        backgroundColor: Colors.SECONDARY,
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    applyButtonTextModal: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
    },
    cancelButtonModal: {
        marginTop: 10,
        alignItems: "center",
    },
    cancelTextModal: {
        color: Colors.SECONDARY,
        fontSize: 16,
    },
});