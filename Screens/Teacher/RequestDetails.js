import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, Platform, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CPB from '../../Components/CPB';
import { Colors } from '../../assets/Colors';
import { collection, doc, getDocs, query, updateDoc, where, } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';

const RequestDetails = () => {
    const { requestDetails = {}, type = '' } = useRoute()?.params || {};
    const [requestedData, setRequestedData] = useState([requestDetails]);
    const [loadingId, setLoadingId] = useState(null);
    const [summaryData, setHistoryData] = useState([]);
    const navigation = useNavigation();


    console.log(requestDetails);

    const handleComplete = async (item) => {
        try {
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
            enrolledStudents:enrolledstudents,
    
          });
    
          setLoadingId(null);
          Alert.alert('Completed', 'The attendance request has been successfully completed.');
        } catch (error) {
          console.error(error.message);
          setLoadingId(null); // Stop loading on error
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
                <CPB percentage={item.percentage || 0} size={80} strokeWidth={6} color={Colors.SECONDARY} />
            </View>
            {type !== 'History' && (
                <View style={styles.requestActionsRow}>
                    <TouchableOpacity style={styles.cancelButton}>
                        <Text style={styles.buttonTextSecondary}>Cancel</Text>
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

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                style={{ paddingHorizontal: 13 }}
                data={requestedData}
                renderItem={renderPendingRequest}
                keyExtractor={(item) => `pending-${item.id}`}
                ListHeaderComponent={
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
                }
                ListEmptyComponent={<Text style={styles.noDataText}>No Pending Requests</Text>}
                ListFooterComponent={
                    <View style={styles.historyContainer}>
                        <Text style={styles.sectionHeader}>Summary</Text>
                        <FlatList
                            data={requestDetails.enrolledStudents}
                            renderItem={renderSummary}
                            keyExtractor={(item) => `history-${item.id}`}
                            ListEmptyComponent={<Text style={styles.noDataText}>No Data Available</Text>}
                        />
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        marginVertical: 10,
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
    sectionHeader: {
        fontSize: 18,
        color: '#333',
        marginVertical: 16,
        fontWeight: 'bold',
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
});
export default RequestDetails;
