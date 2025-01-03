import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    TextInput as RNTextInput,
    FlatList,
    Image,
    Platform,
    
} from 'react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";
import AntDesign from '@expo/vector-icons/AntDesign';
import { Colors } from '../../assets/Colors';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import CPB from '../../Components/CPB';
import { RadioButton,ActivityIndicator } from 'react-native-paper';

const ClassSummary = () => {
    const { className, teacherDetail } = useRoute().params;
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [sortOption, setSortOption] = useState("Name");
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchVisible, setSearchVisible] = useState(false);
    const [serchInp, setSearchInp] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log("Fetching students for class: ", className);

            const studentQuery = query(
                collection(firestore, "UserData"),
                where("class", "==", className),
                where("type", "==", "Student")
            );

            const querySnapshot = await getDocs(studentQuery);

            const studentList = await Promise.all(
                querySnapshot.docs.map(async (doc) => {
                    const attendanceQuery = query(
                        collection(firestore, `UserData/${doc.id}/AttendanceRequests`),
                        where("createdBy", "==", teacherDetail.name)
                    );

                    const attendanceSnapshot = await getDocs(attendanceQuery);

                    let totalAttendance = attendanceSnapshot.size;
                    let completedAttendance = 0;

                    attendanceSnapshot.forEach((attendanceDoc) => {
                        const data = attendanceDoc.data();
                        if (data.status === "Completed") {
                            completedAttendance++;
                        }
                    });

                    const completionPercentage = totalAttendance
                        ? Math.round((completedAttendance / totalAttendance) * 100)
                        : 0;

                    return {
                        id: doc.id,
                        ...doc.data(),
                        attendanceCount: totalAttendance,
                        completionPercentage,
                    };
                })
            );
            setStudents(studentList);
            setFilteredStudents(studentList); 
        } catch (err) {
            console.error("Error fetching students: ", err);
            setError("Failed to load student data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const applySort = (option) => {
        setSortOption(option);
        setFilteredStudents((prev) => {
            const sorted = [...prev];
            if (option === "Name(ASC)") {
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            } else if (option === "Name(DESC)") {
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            } else if (option === "Rollno") {
                return sorted.sort((a, b) => a.rollno.localeCompare(b.rollno));
            } else if (option === "TotalRequest") {
                return sorted.sort((a, b) => b.attendanceCount - a.attendanceCount);
            }
            return sorted;
        });
        setModalVisible(false);
    };

    const handleSearch = (text) => {
        const lowercasedSearch = text.toLowerCase();

        const filtered = students.filter(
            (item) =>
                item.name?.toLowerCase().includes(lowercasedSearch) || // Search by name
                item.rollno?.toString().toLowerCase().includes(lowercasedSearch) // Search by roll number
        );

        setFilteredStudents(filtered); // Update the filtered list
    };

    const clearSearch = () => {
        setFilteredStudents(students); // Reset to original list
        setSearchInp(''); // Clear the search input
    };

    const handleSort = () => {
        setModalVisible(true);
    };

    const renderStudent = useCallback(({ item }) => (
        <View style={styles.studentCard}>
            <Image
                source={{ uri: item.image || 'https://via.placeholder.com/50' }}
                style={styles.studentImage}
            />
            <View style={styles.studentContent}>
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name || 'Unknown Name'}</Text>
                    <Text style={styles.studentDepartment}>Roll no: {item.rollno || 'N/A'}</Text>
                    <Text style={styles.attendanceCount}>Total Requests: {item.attendanceCount}</Text>
                </View>
                <CPB percentage={item.completionPercentage} size={60} strokeWidth={5} tsize={13} color={Colors.SECONDARY} />
            </View>
        </View>
    ), []);

    const renderModal = () => (
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
                            {[
                                { label: "Name(ASC)", value: "Name(ASC)" },
                                { label: "Name(DESC)", value: "Name(DESC)" },
                                { label: "Rollno", value: "Rollno" },
                                { label: "Request", value: "Request" },
                            ].map((option) => (
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} style={styles.loader} />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.emptyText}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.icon} onPress={() => { setSearchVisible(true) }}  >
                        <Ionicons name="search-outline" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon}>
                        <AntDesign name="calendar" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.icon} onPress={handleSort}>
                        <Ionicons name="filter-outline" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </View>
            </View>
            {
                searchVisible && (
                    <View style={styles.searchBox}>
                        <RNTextInput
                            style={styles.input}
                            placeholder="Type here to search"
                            onChangeText={(text) => {
                                setSearchInp(text);
                                handleSearch(text);
                            }}
                            value={serchInp}
                        />
                        <TouchableOpacity onPress={()=>{setSearchVisible(false)}}>
                            <Text style={styles.text}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )
            }
            <FlatList
                style={styles.list}
                data={filteredStudents}
                renderItem={renderStudent}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No students found for this class.</Text>
                }
            />
            {renderModal()}
        </SafeAreaView>
    );
};

export default ClassSummary;




const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop:Platform.OS === 'android' ? 20 : 0,
    },
    list: {
        paddingTop: 10,
    },
    listContainer: {
        paddingHorizontal: 10,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 10,
        padding: 10,
        elevation: 3,
    },
    studentImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    studentContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '500',
        color: "#333",
    },
    studentDepartment: {
        fontSize: 14,
        marginVertical: 5,
        color: Colors.SECONDARY,
    },
    attendanceCount: {
        fontSize: 14,
        color: Colors.SECONDARY,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 10,
        borderWidth: 1,
        borderColor: Colors.SECONDARY,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#ffff'
    },
    input: {
        padding: 8,
        flex: 1,  // Allow the TextInput to take the remaining space
        marginRight: 10,
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: "#777",
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
    icon: {
        marginLeft: 16,
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
    optionText: {
        fontSize: 16,
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
