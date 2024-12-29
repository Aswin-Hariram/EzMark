import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { Colors } from '../../assets/Colors';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';


const StudentRequestHistory = ({ studentDetail }) => {
  const [requestedData, setRequestedData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const navigation = useNavigation();

  const formatDate = (isoString) => format(new Date(isoString), "dd MMM yyyy EEE");

  const handleComplete = async (item) => {
    try {
      navigation.navigate("VerificationScreen",{requestDetails:item,studentDetail:studentDetail})
    } catch (error) {
      console.error("Error completing request: ", error);
      Alert.alert('Error', 'An error occurred while completing the request.');
      setLoadingId(null);
    }
  };

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
      setRequestedData(querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: formatDate(doc.get("createdAt")),
      })));
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (querySnapshot) => {
      setHistoryData(querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: formatDate(doc.get("createdAt")),
      })));
    });

    return () => {
      unsubscribeRequested();
      unsubscribeHistory();
    };
  }, [studentDetail]);


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
        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.buttonTextSecondary}>Cancel</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
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
                <TouchableOpacity style={styles.icon}>
                  <Ionicons name="search-outline" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.icon}>
                  <Ionicons name="filter-outline" size={24} color={Colors.PRIMARY} />
                </TouchableOpacity>
              </View>
            </View>
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
              data={historyData}
              renderItem={renderHistory}
              keyExtractor={(item) => `history-${item.id}`}
              ListEmptyComponent={<Text style={styles.noDataText}>No History Available</Text>}
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
    paddingTop: Platform.OS === 'ios' ? 0 : 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  icon: {
    marginLeft: 16,
  },
  historyContainer: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 18,
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  requestCardContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 10,
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
    fontWeight: 'bold',
    color: '#333',
    fontFamily: "Metro-regular",
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
});

export default StudentRequestHistory;
