import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, Alert, Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import CPB from '../../Components/CPB';
import { Colors } from '../../assets/Colors';
import { collection, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';

const TeacherHistory = ({ teacherDetail }) => {
  const [requestedData, setRequestedData] = useState([]);
  const [loadingId, setLoadingId] = useState(null); // Track loading for specific item
  const [historyData, setHistoryData] = useState([]);
  const navigation = useNavigation();
  const formatDate = (isoString) => format(new Date(isoString), "dd MMM yyyy EEE");

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

      await updateDoc(doc(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`, item.id), {
        status: "Closed",
      });

      setLoadingId(null);
      Alert.alert('Completed', 'The attendance request has been successfully completed.');
    } catch (error) {
      console.error(error.message);
      setLoadingId(null); // Stop loading on error
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
      setRequestedData(temp);
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (querySnapshot) => {
      const temp = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatDate(doc.get("createdAt")),
        percentage: ((doc.get("totalNumberOfStudents") - doc.get("pendingNumberOfStudents")) / doc.get("totalNumberOfStudents")) * 100
      }));
      setHistoryData(temp);
    });

    return () => {
      unsubscribeRequested();
      unsubscribeHistory();
    };
  }, [teacherDetail]);

  const renderPendingRequest = ({ item }) => (
    <View key={item.id} style={styles.requestCardContainer}>
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
        <CPB percentage={item.percentage || 0} size={80} strokeWidth={6} color={Colors.SECONDARY} />
      </View>
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
    </View>
  );

  const renderHistory = ({ item }) => (
    <TouchableOpacity key={item.id} style={styles.requestCardContainer} onPress={() => {
        navigation.navigate("RequestDetails",{requestDetails:item,type:"History"})
    }}>
      <View style={styles.requestCard}>
        <View style={styles.requestDetails}>
          <View style={styles.requestedContainer}>
            <Text style={styles.label}>{item.status}</Text>
          </View>
          <View style={styles.classContainer}>
            <Text style={{ ...styles.classText, marginRight: 5, fontSize: 18 }}>{item.class || 'N/A'}</Text>
            <Text style={{ ...styles.classText, fontSize: 14 }}>{` ( ${item.subjectName} )`}</Text>
          </View>
          <Text style={styles.dateText}>{item.time || 'Unknown Date'}</Text>
        </View>
        <CPB percentage={item.percentage || 0} size={65} strokeWidth={4} tsize={14} color={Colors.SECONDARY} />
      </View>
    </TouchableOpacity>
  );

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
                  <Ionicons name="filter-outline" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
              </View>
            </View>
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
    marginVertical: Platform.OS === 'ios' ? 0 : 0,
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
  contentContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#333',
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
    fontSize: 22,
    fontWeight: 'condensedBold',
    fontFamily: 'Signika',
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
    paddingHorizontal: 16,
  },
});

export default TeacherHistory;
