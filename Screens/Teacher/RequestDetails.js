import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, Modal, TouchableWithoutFeedback, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CPB from '../../Components/CPB';
import { Colors } from '../../assets/Colors';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import dp from "../../assets/Teachers/profile.png"
import { TextInput, RadioButton } from 'react-native-paper';

const RequestDetails = () => {
    const { requestDetails = {}, type = '', teacherDetail } = useRoute()?.params || {};
    const [requestedData, setRequestedData] = useState([requestDetails]);
    const [loadingId, setLoadingId] = useState(null);
    const [loadingDId, setLoadingDId] = useState(null);
    const [summaryData, setHistoryData] = useState(requestDetails.enrolledStudents);
    const [sortOption, setSortOption] = useState("No Filter");
    const [modalVisible, setModalVisible] = useState(false)
    const navigation = useNavigation();


    console.log(requestDetails);

    const handleComplete = async (item) => {
        try {
            if (!teacherDetail) throw new Error('Teacher details not found');
            setLoadingId(item.id); // Start loading for specific item

            const studentQuery = query(
                collection(firestore, "UserData"),
                where("class", "==", item.class || ""),
                where("type", "==", "Student")
            );

            const querySnapshot = await getDocs(studentQuery);

            if (querySnapshot.empty) {
                Alert.alert('No Students Found', `No students enrolled in class: ${item.class}`);
                setLoadingId(null); // Stop loading if no students found
                return;
            }

            for (const userDoc of querySnapshot.docs) {
                const reqQuery = query(
                    collection(firestore, `UserData/${userDoc.id}/AttendanceRequests`),
                    where("status", "==", "Requested"),
                    where("createdAt", "==", item.createdAt),
                    where("class", "==", item.class),
                    where("createdBy", "==", item.createdBy),
                    where("subjectName", "==", item.subjectName)
                );

                const snap = await getDocs(reqQuery);

                for (const req of snap.docs) {
                    await updateDoc(doc(firestore, `UserData/${userDoc.id}/AttendanceRequests`, req.id), {
                        status: "Closed"
                    });
                }
            }
            const enrolledstudents = item.enrolledStudents
            enrolledstudents.forEach(student => {
                console.log(student.status)
                if (student.status === "Requested") {
                    student.status = "Closed";

                }
            });
            console.log(enrolledstudents)
            await updateDoc(doc(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`, item.id), {
                status: "Closed",
                enrolledStudents: enrolledstudents,

            });

            setLoadingId(null);
            Alert.alert('Completed', 'The attendance request has been successfully completed.');
        } catch (error) {
            console.error(error.message);
            setLoadingId(null); // Stop loading on error
        }


    };
    const handleCancel = async (item) => {
        try {
            setLoadingDId(item.id); // Start loading for specific item
            console.log("Item=>", item)
            const studentQuery = query(
                collection(firestore, "UserData"),
                where("class", "==", item.class || ""),
                where("type", "==", "Student")
            );

            const querySnapshot = await getDocs(studentQuery);

            if (querySnapshot.empty) {
                Alert.alert('No Students Found', `No students enrolled in class: ${item.class}`);
                setLoadingId(null); // Stop loading if no students found
                return;
            }

            for (const userDoc of querySnapshot.docs) {
                const reqQuery = query(
                    collection(firestore, `UserData/${userDoc.id}/AttendanceRequests`),
                    where("status", "==", "Requested"),
                    where("createdAt", "==", item.createdAt),
                    where("class", "==", item.class),
                    where("createdBy", "==", item.createdBy),
                    where("subjectName", "==", item.subjectName)
                );

                const snap = await getDocs(reqQuery);

                for (const req of snap.docs) {
                    await deleteDoc(doc(firestore, `UserData/${userDoc.id}/AttendanceRequests`, req.id));
                }
            }
            const enrolledstudents = item.enrolledStudents
            enrolledstudents.forEach(student => {
                console.log(student.status)
                if (student.status === "Requested") {
                    student.status = "Closed";
                }
            });
            console.log(enrolledstudents)
            await deleteDoc(doc(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`, item.id));

            setLoadingDId(null);
            Alert.alert('Completed', 'The attendance request has been successfully completed.');
        } catch (error) {
            console.error(error.message);
            setLoadingDId(null); // Stop loading on error
        }


    };

    const renderPendingRequest = useCallback(({ item }) => (
        <View style={styles.requestCardContainer}>
            <View style={styles.requestCard}>
                <View style={styles.requestDetails}>
                    <View style={styles.requestedContainer}>
                        <Text style={styles.label}>Requested</Text>
                    </View>
                    <View style={styles.classContainer}>
                        <Text style={styles.classText}>{item.class || 'N/A'}</Text>
                        <Text style={styles.subjectText}>{` (${item.subjectName})`}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.time || 'Unknown Date'}</Text>
                </View>
                <CPB percentage={item.percentage || 0} size={80} tsize={item.percentage >= 100 ? 16 : 18} strokeWidth={6} color={Colors.SECONDARY} />
            </View>
            {type !== 'History' && (
                <View style={styles.requestActionsRow}>
                    <TouchableOpacity style={styles.cancelButton} disabled={loadingDId === item.id} onPress={() => { handleCancel(requestDetails) }} >
                        <Text style={styles.buttonTextSecondary}>{loadingDId === item.id ? 'Deleting...' : 'Delete'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => handleComplete(item)}
                        disabled={loadingId === item.id}
                    >
                        <Text style={styles.buttonText}>
                            {loadingId === item.id ? 'Completing...' : 'Complete'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    ), [loadingId]);

    const renderSummary = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.requestCardContainer}
            onPress={() => {

            }}
        >
            <View style={styles.requestCard}>
                <View style={styles.requestDetailsSummary}>

                    <View style={styles.classContainerSummary}>
                        <Text style={styles.emailText}>{item.rollno || 'N/A'}</Text>

                    </View>
                    <View style={styles.requestedContainerSummary}>
                        <Text style={styles.label}>{item.status}</Text>
                    </View>

                </View>

            </View>
        </TouchableOpacity>
    ), []);
    const renderMap = (enrolledStudents) => {
        // Debug enrolled students
        console.log('Enrolled Students:', enrolledStudents);

        // Filter students with "Completed" status
        const completedStudents = enrolledStudents.filter((s) => s.status === "Completed");

        // Default region if no students have been enrolled
        const defaultRegion = {
            latitude: 8.7934369,
            longitude: 78.1329182,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

        // Set initial region dynamically based on the first completed student's location
        const initialRegion =
            completedStudents.length > 0
                ? {
                    latitude: completedStudents[0].locationLat,
                    longitude: completedStudents[0].locationLong,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                }
                : defaultRegion;

        return (
            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        marginVertical: 10,
                        textAlign: 'center',
                    }}
                >
                    Map
                </Text>
                <MapView
                    style={{
                        flex: 1,
                        width: '100%',

                        padding: 5,
                        height: 400,
                    }}
                    initialRegion={initialRegion} // Use initialRegion instead of region
                >
                    {enrolledStudents.map((student, index) => {
                        // Debug individual student coordinates
                        console.log(`Student ${student.rollno}:`, student.locationLat, student.locationLong);

                        if (student.locationLat && student.locationLong) {
                            return (
                                <Marker
                                    key={student.id || index}
                                    coordinate={{
                                        latitude: student.locationLat,
                                        longitude: student.locationLong,
                                    }}
                                    title={`Roll No: ${student.rollno}`}
                                    description={`Status: ${student.status}`}
                                >
                                </Marker>
                            );
                        }
                    })}
                </MapView>
            </View>
        );
    };

    const applySort = (option) => {
        setSortOption(option);

        if (option === "No Filter") {
            console.log("Data=>", requestDetails)
            setHistoryData(requestDetails.enrolledStudents);
        } else {
            console.log("Data=>", requestDetails)
            const filteredData = requestDetails.enrolledStudents.filter(
                (student) => student.status === option
            );
            setHistoryData(filteredData);
        }
        setModalVisible(false);
    };

    const renderModal = () => {

        const options = [
            { label: "Requested", value: "Requested" },
            { label: "Completed", value: "Completed" },
            { label: "Closed", value: "Closed" },
            { label: "Rejected", value: "Rejected" },
            { label: "No Filter", value: "No Filter" },
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
            <FlatList
                style={{ paddingHorizontal: 13 }}
                data={requestedData}
                renderItem={renderPendingRequest}
                keyExtractor={(item) => `pending-${item.id}`}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                                <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                                <Text style={styles.backText}>Back</Text>
                            </TouchableOpacity>
                            <View style={styles.rightIcons}>
                                <TouchableOpacity style={styles.icon}>
                                    <Ionicons name="search-outline" size={24} color={Colors.PRIMARY} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.icon}>
                                    <Ionicons name="ellipsis-vertical" size={24} color={Colors.PRIMARY} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                }
                ListEmptyComponent={<Text style={styles.noDataText}>No Pending Requests</Text>}
                ListFooterComponent={
                    <View style={styles.historyContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', alignItems: 'center', margin: 10 }}>
                            <Text style={styles.sectionHeader}>Summary</Text>
                            <TouchableOpacity style={{ ...styles.icon, alignSelf: 'flex-end' }} onPress={() => { setModalVisible(true); }}>
                                <Ionicons name="filter-outline" size={24} color={Colors.PRIMARY} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={summaryData}
                            renderItem={renderSummary}
                            keyExtractor={(item) => `history-${item.id}`}
                            ListEmptyComponent={<Text style={styles.noDataText}>No Data Available</Text>}
                        />
                        {renderMap(requestDetails.enrolledStudents)}
                        {renderModal()}
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Platform.OS === 'ios' ? 0 : 25,
    },
    noDataText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    header: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 1,
    },
    leftIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 4,
        color: 'black',
        fontSize: 16,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 16,
    },
    requestCardContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 10,
        marginVertical: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0.5, height: 2 },
    },
    requestCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    requestDetails: {
        flex: 1,
    },
    requestedContainer: {
        backgroundColor: Colors.lightBg,
        padding: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 14,
        color: 'black',
    },
    emailText: {
        fontFamily: "Metro-regular",
        fontSize: 18,
    },
    classContainer: {
        flexDirection: 'row',
        paddingVertical: 8,
        alignItems: 'center',
    },
    classText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    subjectText: {
        fontSize: 14,
        color: '#333',
    },
    dateText: {
        fontSize: 14,
        color: '#888',
    },
    requestActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        width: '100%',
    },
    cancelButton: {
        backgroundColor: '#ebf4f9',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
    },
    closeButton: {
        backgroundColor: Colors.SECONDARY,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonTextSecondary: {
        color: '#333',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    historyContainer: {
        paddingHorizontal: 5,
    },

    requestDetailsSummary: {
        flex: 1, // Ensures the content stretches across the available space
        flexDirection: 'row',
        justifyContent: 'space-between', // Distribute items at both ends of the row
        alignItems: 'center', // Vertically align the items
    },
    classContainerSummary: {
        flexDirection: 'row',
        alignItems: 'center', // Align items vertically
        justifyContent: 'flex-start', // Left-align the roll number
    },
    emailText: {
        fontSize: 16,
        fontWeight: '500', // Adjust for readability and emphasis
        color: Colors.DARK_GRAY, // Assuming you have a dark gray color defined
        flexWrap: 'wrap', // Ensure the text wraps if it's too long
    },
    requestedContainerSummary: {
        backgroundColor: Colors.lightBg,
        padding: 4,
        borderRadius: 4,
        alignSelf: 'flex-end',// Minimum width to avoid squeezing
    },
    label: {
        fontSize: 14,
        fontWeight: '400', // Regular weight for status text
        color: Colors.WHITE, // White text on colored background
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: "bold",

    },
    locationPin: {
        alignItems: 'center',
    },
    pinTop: {
        width: 50,
        height: 50,
        borderRadius: 25, // Makes it circular
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#FF5722',
        borderWidth: 2,
    },
    markerImage: {
        width: 30,
        height: 30,
    },
    pinBottom: {
        width: 10,
        height: 20,
        backgroundColor: '#FF5722',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        marginTop: -2, // To slightly overlap with the top
    },
    markerLabel: {
        fontSize: 12,
        color: '#333',
        marginTop: 5,
        textAlign: 'center',
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
export default RequestDetails;
