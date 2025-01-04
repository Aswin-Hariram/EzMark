import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, Platform, Modal, TextInput as RNTextInput,
  TouchableWithoutFeedback,
  Pressable
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import CPB from '../../Components/CPB';
import { Colors } from '../../assets/Colors';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { format } from 'date-fns';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useNavigation } from '@react-navigation/native';
import { FAB, RadioButton, TextInput } from 'react-native-paper';

const TeacherHistory = ({ teacherDetail }) => {
  const [requestedData, setRequestedData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [loadingDId, setLoadingDId] = useState(null); // Track loading for specific item
  const [historyData, setHistoryData] = useState([]);
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false)
  const [sortOption, setSortOption] = useState("date");
  const [searchVisible, setSearchVisible] = useState(false)

  const [serchInp, setSearchInp] = useState('')

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    if (isNaN(date)) return 'Invalid Date'; // Return a fallback if the date is invalid
    return format(date, "dd MMM yyyy EEE");
  };

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
      Alert.alert('Deleted', 'The attendance request has been successfully deleted.');
    } catch (error) {
      console.error(error.message);
      setLoadingDId(null); // Stop loading on error
    }


  };

  useEffect(() => {
    if (!teacherDetail?.id) return;

    const q = query(
      collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`),
      where("status", "==", "Requested")
    );

    const historyQuery = query(
      collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`),
      where("status", "!=", "Requested")
    );

    const unsubscribeRequested = onSnapshot(q, (querySnapshot) => {
      const temp = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatDate(doc.get("createdAt")),
        percentage: ((doc.get("totalNumberOfStudents") - doc.get("pendingNumberOfStudents")) / doc.get("totalNumberOfStudents")) * 100
      }));
      temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequestedData(temp);
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (querySnapshot) => {
      const temp = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatDate(doc.get("createdAt")),
        percentage: ((doc.get("totalNumberOfStudents") - doc.get("pendingNumberOfStudents")) / doc.get("totalNumberOfStudents")) * 100
      }));
      temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistoryData(temp);
    });

    return () => {
      unsubscribeRequested();
      unsubscribeHistory();
      applySort(sortOption);
    };
  }, [teacherDetail]);
  useEffect(() => {

    if (!teacherDetail?.id) return; // Early return to avoid query execution

    if (serchInp === "") {


      const q = query(
        collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`),
        where("status", "==", "Requested")
      );

      const historyQuery = query(
        collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`),
        where("status", "!=", "Requested")
      );

      const unsubscribeRequested = onSnapshot(q, (querySnapshot) => {
        const temp = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: formatDate(doc.get("createdAt")),
          percentage: ((doc.get("totalNumberOfStudents") - doc.get("pendingNumberOfStudents")) / doc.get("totalNumberOfStudents")) * 100
        }));
        temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequestedData(temp);
      });

      const unsubscribeHistory = onSnapshot(historyQuery, (querySnapshot) => {
        const temp = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: formatDate(doc.get("createdAt")),
          percentage: ((doc.get("totalNumberOfStudents") - doc.get("pendingNumberOfStudents")) / doc.get("totalNumberOfStudents")) * 100
        }));
        temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHistoryData(temp);
      });

      return () => {
        unsubscribeRequested();
        unsubscribeHistory();
        applySort(sortOption);
      };
    }
  }, [serchInp]);


  const renderPendingRequest = ({ item }) => (

    <TouchableOpacity key={item.id} style={styles.requestCardContainer} onPress={() => {
      navigation.navigate("RequestDetails", { requestDetails: item, type: "Pending", teacherDetail: teacherDetail })
    }}>

      <View style={styles.requestCard}>
        <View style={styles.requestDetails}>
          <View style={styles.requestedContainer}>
            <Text style={styles.label}>Requested</Text>
          </View>
          <View style={styles.classContainer}>
            <Text style={{ ...styles.classText, marginRight: 5 }}>{item.class || 'N/A'}</Text>
            <Text style={{ ...styles.classText, fontSize: 15 }}>{` ( ${item.subjectName} )`}</Text>
          </View>
          <Text style={styles.dateText}>{item.time || 'Unknown Date'}</Text>
        </View>
        <CPB percentage={item.percentage || 0} size={80} strokeWidth={6} color={Colors.SECONDARY} tsize={item.percentage >= 100 ? 16 : 18} />
      </View>
      <View style={styles.requestActionsRow}>
        <TouchableOpacity style={styles.cancelButton}
          onPress={() => { handleCancel(item) }}
          disabled={loadingDId === item.id}
        >
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
    </TouchableOpacity>
  );

  const renderHistory = ({ item }) => (
    <TouchableOpacity key={item.id} style={styles.requestCardContainer} onPress={() => {
      navigation.navigate("RequestDetails", { requestDetails: item, type: "History" })
    }}>
      <View style={styles.requestCard}>
        <View style={styles.requestDetails}>
          <View style={styles.requestedContainer}>
            <Text style={styles.label}>{item.status}</Text>
          </View>
          <View style={styles.classContainer}>
            <Text style={{ ...styles.classText, marginRight: 5, fontSize: 18 }}>{item.class || 'N/A'}</Text>
            <Text style={{ ...styles.classText, fontSize: 14, fontWeight: 'normal' }}>{` ( ${item.subjectName} )`}</Text>
          </View>
          <Text style={styles.dateText}>{item.time || 'Unknown Date'}</Text>
        </View>
        <CPB percentage={item.percentage || 0} size={65} strokeWidth={4} tsize={14} color={Colors.SECONDARY} />
      </View>
    </TouchableOpacity>
  );
  const applySort = (option) => {
    setSortOption(option);

    if (option === "date") {
      setRequestedData((prev) =>
        [...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
      setHistoryData((prev) =>
        [...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } else if (option === "Class") {
      setRequestedData((prev) =>
        [...prev].sort((a, b) => a.class.localeCompare(b.class))
      );
      setHistoryData((prev) =>
        [...prev].sort((a, b) => a.class.localeCompare(b.class))
      );

    }
    else if (option === "Subject Name (ASC)") {
      setRequestedData((prev) =>
        [...prev].sort((a, b) => a.subjectName.localeCompare(b.subjectName))
      );
      setHistoryData((prev) =>
        [...prev].sort((a, b) => a.subjectName.localeCompare(b.subjectName))
      );

    } else if (option === "Subject Name (DESC)") {
      setRequestedData((prev) =>
        [...prev].sort((a, b) => b.subjectName.localeCompare(a.subjectName))
      );
      setHistoryData((prev) =>
        [...prev].sort((a, b) => b.subjectName.localeCompare(a.subjectName))
      );
    }
    else if (option === "status") {
      setHistoryData((prev) =>
        [...prev].sort((a, b) => a.status.localeCompare(b.status))
      );
    }
    setModalVisible(false);
  };
  const renderModal = () => {
    const options = [
      { label: "Date", value: "date" },
      { label: "Class", value: "Class" },
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
  const handleSearchInputChange = (text) => {
    setSearchInp(text);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(handleSearch, 500); // Debounce search by 500ms
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
      showsVerticalScrollIndicator={false}
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
            <View style={styles.contentContainer}>
              <Text style={styles.sectionHeader}>Pending Request</Text>
            </View>
          </>
        }
        ListEmptyComponent={<Text style={styles.noDataText}>No Pending Requests</Text>}
        ListFooterComponent={
          <>
            <View style={styles.historyContainer}>
              <Text style={styles.sectionHeader}>History</Text>
            </View>
            {historyData.length > 0 ? (
              <FlatList
              showsVerticalScrollIndicator={false}
                data={historyData}
                renderItem={renderHistory}
                keyExtractor={(item) => `history-${item.id}`}
                ListEmptyComponent={<Text style={styles.noDataText}>No History Available</Text>}
              />
            ) : (
              <Text style={styles.noDataText}>No History Available</Text>
            )}
          </>
        }
      />
      {renderModal()}
      <FAB
        icon="plus"
        color="white"
        style={styles.fab}
        onPress={() => {
          navigation.navigate("CreateRequest", { teacherDetail: teacherDetail });
        }}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 5,
    bottom: 5,
    backgroundColor: Colors.SECONDARY,
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
    marginTop: Platform.OS === 'ios' ? 0 : 25,
  },
  noDataText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: Platform.OS === 'ios' ? 0 : 0,
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
    fontSize: 16,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 16,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    color: Colors.SECONDARY,
    marginVertical: 16,
    fontWeight: 'bold',
  },
  requestCardContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
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
  classContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
  },

  classText: {
    fontSize: 18,
    color: '#333',
    fontFamily: 'Signika-regular',
    fontWeight: 600,
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
    paddingHorizontal: 16,
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

export default TeacherHistory;
