import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Platform,
  TextInput as RNTextInput,
  Modal,
  TouchableWithoutFeedback,
  Pressable
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from '../../assets/Colors';
import AntDesign from '@expo/vector-icons/AntDesign';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { RadioButton, TextInput } from 'react-native-paper';



const StudentRequestHistory = ({ studentDetail }) => {
  const [requestedData, setRequestedData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false)
  const [sortOption, setSortOption] = useState("date");
  const [searchVisible, setSearchVisible] = useState(false)
  const [isCUpdating, setIsDUpdating] = useState(false)

  const [serchInp, setSearchInp] = useState('')

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (isNaN(date)) return 'Invalid Date'; // Return a fallback if the date is invalid
    return format(date, "dd MMM yyyy EEE");
  };


  const handleComplete = async (item) => {
    try {
      navigation.navigate("VerificationScreen", { requestDetails: item, studentDetail: studentDetail })
    } catch (error) {
      console.error("Error completing request: ", error);
      Alert.alert('Error', 'An error occurred while completing the request.');
      setLoadingId(null);
    }
  };

  const updateFirestore = async (otpValue, requestDetails) => {
    try {
      console.log("Starting updateFirestore...");
      setIsDUpdating(true);
      const attendanceRef = collection(
        firestore,
        `UserData/${studentDetail.id}/AttendanceRequests`
      );
      const attendanceQuery = query(
        attendanceRef,
        where("status", "==", "Requested"),
        where("createdBy", "==", requestDetails.createdBy),
        where("createdAt", "==", requestDetails.createdAt),
        where("id", "==", requestDetails.id)
      );

      const snapshot = await getDocs(attendanceQuery);

      if (snapshot.empty) {
        console.log("No matching AttendanceRequests found for the student.");
        return;
      }

      await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const docRef = doc(
          firestore,
          `UserData/${studentDetail.id}/AttendanceRequests`,
          docSnapshot.id
        );

        await updateDoc(docRef, {
          status: "Rejected",
          ctime: new Date().toISOString(),
          locationLat: '',
          locationLong: ''
        });
      }));

      if (!requestDetails.teacherId) {
        throw new Error("Missing teacherId in requestDetails.");
      }

      const teacherAttendanceQuery = query(
        collection(firestore, `UserData/${requestDetails.teacherId}/AttendanceRequests`),
        where("createdAt", "==", requestDetails.createdAt),
        where("otp", "==", otpValue)
      );

      const teacherSnapshot = await getDocs(teacherAttendanceQuery);

      if (teacherSnapshot.empty) {
        console.log("No matching teacher AttendanceRequests found.");
        return;
      }

      await Promise.all(teacherSnapshot.docs.map(async (d) => {
        const enrolledStudents = d.get("enrolledStudents") || [];

        if (!Array.isArray(enrolledStudents)) {
          console.warn("Invalid enrolledStudents format.");
          return;
        }
        const updatedStudents = enrolledStudents.map((student) => {
          if (
            student.email === auth.currentUser.email
          ) {
            return { ...student, status: "Rejected", ctime: new Date().toISOString(), locationLat: '', locationLong: '' };
          }
          return student;
        });
        console.log("updatedStudents", updatedStudents)
        const teacherDocRef = doc(
          firestore,
          `UserData/${requestDetails.teacherId}/AttendanceRequests`,
          d.id
        );

        await updateDoc(teacherDocRef, {
          enrolledStudents: updatedStudents,
          pendingNumberOfStudents: d.get("pendingNumberOfStudents") - 1,

        });
      }));

      console.log("Firestore updates completed successfully.");
    } catch (err) {
      console.error("Error updating Firestore:", err);
    } finally {
      setIsDUpdating(false);
      Alert.alert('Success', 'Request Rejected Successfully');
    }
  };
  const handleCancel = async (item) => {
    console.log("item=>", item)
    console.log("cancel pressed...")
    updateFirestore(item.otp, item)

  }
  useEffect(() => {
    if (!studentDetail?.id) return;

    const requestedQuery = query(
      collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
      where("status", "==", "Requested")
    );

    const historyQuery = query(
      collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
      where("status", "!=", "Requested")
    );

    const unsubscribeRequested = onSnapshot(requestedQuery, (querySnapshot) => {
      setRequestedData(
        querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            time: formatDate(doc.get("createdAt")),
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by createdAt
      );
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (querySnapshot) => {
      setHistoryData(
        querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            time: formatDate(doc.get("createdAt")),
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    });

    return () => {
      unsubscribeRequested();
      unsubscribeHistory();
    };
  }, [studentDetail]);

  useEffect(() => {
    if (!studentDetail?.id) return;

    if (serchInp === "") {
      const requestedQuery = query(
        collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
        where("status", "==", "Requested")
      );

      const historyQuery = query(
        collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
        where("status", "!=", "Requested")
      );

      getDocs(requestedQuery).then((querySnapshot) => {
        setRequestedData(
          querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              time: formatDate(doc.get("createdAt")),
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by createdAt
        );
      });

      getDocs(historyQuery).then((querySnapshot) => {
        setHistoryData(
          querySnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              time: formatDate(doc.get("createdAt")),
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by createdAt
        );
      });
    }
  }, [serchInp]);




  const renderPendingRequest = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.requestCardContainer}
      onPress={() => {

      }}
    >
      <View style={styles.requestCard}>
        <View style={styles.requestDetails}>
          <View style={styles.classContainer}>
            <Text style={styles.classText}>{item.subjectName || 'N/A'}</Text>
          </View>
          <Text style={styles.createdBy}>Requested By: {item.createdBy || 'Unknown'}</Text>
          <Text style={styles.dateText}>{item.time || 'Unknown Date'}</Text>
        </View>

        <View style={styles.requestedContainer}>
          <Text style={styles.label}>New Request</Text>
        </View>
      </View>
      <View style={styles.requestActionsRow}>
        <TouchableOpacity style={styles.cancelButton}
          onPress={() => { handleCancel(item) }}>
          <Text style={styles.buttonTextSecondary}>{isCUpdating ? "Rejecting..." : "Reject"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => handleComplete(item)}
          disabled={loadingId === item.id}
        >
          <Text style={styles.buttonText}>
            Verify
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHistory = ({ item }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.requestCardContainer}
      onPress={() => {

      }}
    >
      <View style={styles.requestCard}>
        <View style={styles.requestDetails}>
          <Text style={styles.classText}>{item.subjectName || 'N/A'}</Text>
          <Text style={styles.createdBy}>Requested By: <Text style={{
            fontSize: 17,
            fontWeight: 'condensedBold',
            color: Colors.PRIMARY,
            fontFamily: "Metro-regular",
          }}>{item.createdBy || 'Unknown'}</Text></Text>
          <Text style={styles.dateText}>{item.time || 'Unknown Date'}</Text>
        </View>
        <View style={styles.requestedContainer}>
          <Text style={styles.label}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const applySort = (option) => {
    setSortOption(option); // Set the current sort option

    const sortData = (data) => {
      switch (option) {
        case "date":
          return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by date (newest first)
        case "Subject Name (ASC)":
          return data.sort((a, b) =>
            (a.subjectName || "").localeCompare(b.subjectName || "")
          ); // Sort by subject name ascending
        case "Subject Name (DESC)":
          return data.sort((a, b) =>
            (b.subjectName || "").localeCompare(a.subjectName || "")
          ); // Sort by subject name descending
        case "status":
          return data.sort((a, b) =>
            (a.status || "").localeCompare(b.status || "")
          ); // Sort by status alphabetically
        default:
          return data;
      }
    };

    setRequestedData((prevData) => [...sortData(prevData)]);
    setHistoryData((prevData) => [...sortData(prevData)]);
    setModalVisible(false); // Close the modal after applying the sort
  };

  const renderModal = () => {
    const options = [
      { label: "Date", value: "date" },
      { label: "Subject Name (ASC)", value: "Subject Name (ASC)" },
      { label: "Subject Name (DESC)", value: "Subject Name (DESC)" },
      { label: "Status", value: "status" },
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

  const handleSort = () => {
    setModalVisible(true)
  }
  const handleSearchByDate = () => {
    setModalVisible(true)
  }

  const handleSearch = () => {
    const lowercasedSearch = serchInp.toLowerCase();

    // Filter requestedData
    const filteredRequestedData = requestedData.filter(
      (item) =>
        item.subjectName?.toLowerCase().includes(lowercasedSearch) ||
        item.createdBy?.toLowerCase().includes(lowercasedSearch)
    );

    // Filter historyData
    const filteredHistoryData = historyData.filter(
      (item) =>
        item.subjectName?.toLowerCase().includes(lowercasedSearch) ||
        item.createdBy?.toLowerCase().includes(lowercasedSearch) ||
        item.status?.toLowerCase().includes(lowercasedSearch)
    );

    setRequestedData(filteredRequestedData);
    setHistoryData(filteredHistoryData);
  };

  // Debounced search handler using useRef
  const searchTimeout = useRef(null);

  const handleSearchInputChange = (text) => {
    setSearchInp(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(handleSearch, 500); // Debounce search by 500ms
  };

  <RNTextInput
    style={styles.input}
    placeholder="Type here to search"
    onChange={(e) => handleSearchInputChange(e.nativeEvent.text)} // Updated to debounced handler
    value={serchInp}
  />


  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={requestedData}
        renderItem={renderPendingRequest}
        keyExtractor={(item) => `pending-${item.id}`}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.rightIcons}>
                <TouchableOpacity style={styles.icon} onPress={() => { setSearchVisible(true) }} >
                  <Ionicons name="search-outline" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.icon} onPress={handleSearchByDate}>
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
                    onChange={(e) => {
                      setSearchInp(e.nativeEvent.text); // Update state with the text from the input
                      handleSearch(); // Perform search filtering
                    }}
                    value={serchInp}

                  />
                  <TouchableOpacity onPress={() => { setSearchVisible(false) }}>
                    <Text style={styles.text}>Close</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            <View style={styles.historyContainer}>
              <Text style={styles.sectionHeader}>Pending Request</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.noDataText}>No Pending Requests</Text>}
        ListFooterComponent={
          <View>
            <View style={styles.historyContainer}>
              <Text style={styles.sectionHeader}>History</Text>
            </View>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={historyData}
              renderItem={renderHistory}
              keyExtractor={(item) => `history-${item.id}`}
              ListEmptyComponent={<Text style={styles.noDataText}>No History Available</Text>}
            />
            {renderModal()}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  Bcontainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: 'grey',
  },
  BcontentContainer: {
    flex: 1,
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
  text: {
    fontSize: 16,
    color: '#333',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 15,
    marginBottom: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1
  },
  icon: {
    marginLeft: 16,
  },
  historyContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    color: Colors.SECONDARY,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  requestCardContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestDetails: {
    flex: 1,
  },
  classContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Signika-regular',
    fontWeight: 600,
  },
  createdBy: {
    fontSize: 16,
    color: "black",
    marginVertical: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  requestedContainer: {
    backgroundColor: Colors.lightBg,
    padding: 4,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    color: '#333',
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
  noDataText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
    fontSize: 14,
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

export default StudentRequestHistory;
