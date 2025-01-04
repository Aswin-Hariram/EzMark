import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, Modal, View, Platform, SafeAreaView, } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors } from '../../assets/Colors';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo'
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import profilePic from '../../assets/Teachers/profile.png';
import { ActivityIndicator, RadioButton } from 'react-native-paper';


const ManageStudents = () => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setisLoading] = useState(true)
    const [searchVisible, setSearchVisible] = useState(false);
    const [Students, setStudents] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [sortOption, setSortOption] = useState('Name(A-Z)');
    const getStudents = async () => {
        console.log('Fetching students from database');

        try {
            setisLoading(true)

            const q = query(collection(firestore, 'UserData'), where('type', '==', 'Student'));
            const querySnapshot = await getDocs(q);
            const stud = []; // Temporary array to hold fetched students
            querySnapshot.forEach((doc) => {
                console.log(doc.id, ' => ', doc.data());
                stud.push(doc.data()); // Add Student data to the array
            });
            setStudents(stud); // Set state with all fetched students
        } catch (error) {
            console.log('Error getting documents: ', error);
        } finally {
            setisLoading(false)
        }
    };

    useEffect(() => {
        getStudents();
    }, []);

    const filteredStudents = Students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.rollno.toLowerCase().includes(searchQuery.toLowerCase()) // Filter by roll number as well
    );


    if (isLoading) {
        return (<View style={{ flex: 1, justifyContent: 'center', alignContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size={'small'} color={Colors.PRIMARY} />
        </View>)
    }

    const applySort = (option) => {
        setSortOption(option);
        // Example sorting logic
        const sortedStudents = [...Students];
        if (option === 'Name(A-Z)') {
            sortedStudents.sort((a, b) => a.name.localeCompare(b.name));
        } else if (option === 'Name(Z-A)') {
            sortedStudents.sort((a, b) => b.name.localeCompare(a.name));
        }
        else if (option === 'Deparment') {
            sortedStudents.sort((a, b) => a.department.localeCompare(b.department));
        }
        setStudents(sortedStudents);
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
                    <TouchableOpacity style={styles.icon} onPress={()=>{setModalVisible(true)}}>
                        <Ionicons name="filter-outline" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </View>

            </View>
            {
                searchVisible &&
                <View style={styles.search}>
                    <TextInput
                        style={styles.input}
                        placeholder="Search Students"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        cursorColor={Colors.SECONDARY}
                    />
                    <TouchableOpacity onPress={() => { setSearchVisible(false) }}>
                        <Text style={styles.text}>Close</Text>
                    </TouchableOpacity>
                </View>
            }

            {/* Students List */}
            {filteredStudents.length > 0 ? (
                <FlatList
                    style={{ marginTop: 13 }}
                    data={filteredStudents}
                    refreshing={isLoading}
                    onRefresh={getStudents}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.teacherCard}
                            onPress={() => navigation.navigate('StudentProfile', { student: item, getStudent: getStudents })}>
                            <View style={styles.image}>
                                <Image style={styles.profile_img} source={item.image ? { uri: item.image } : profilePic} />
                            </View>
                            <View style={styles.info}>
                                <Text style={styles.teacherName}>{item.name}</Text>
                                <Text style={styles.teacherDept}>Department: {item.department}</Text>
                                {/* Wrap rollno in a <Text> component */}
                                <Text style={styles.teacherDept}>Roll No: {item.rollno}</Text>
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
                    <Text style={{ color: Colors.SECONDARY, fontSize: 16 }}>No Students found</Text>
                </View>
            )}

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.floating_btn}
                activeOpacity={0.7}
                accessibilityLabel="Add Student"
                onPress={() => {
                    navigation.navigate("AddStudent", { getStudents: getStudents })
                }}
            >
                <Entypo name="plus" size={24} color="white" />
            </TouchableOpacity>

            {renderModal()}
        </SafeAreaView>
    );
};

export default ManageStudents;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
        color: "black",
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
    }, modalContainer: {
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