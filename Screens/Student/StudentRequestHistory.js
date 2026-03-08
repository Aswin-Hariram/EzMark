import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { Colors } from '../../assets/Colors';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const sortRequests = (items, option) => {
  const nextItems = [...items];

  if (option === 'Subject') {
    return nextItems.sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
  }

  if (option === 'Status') {
    return nextItems.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
  }

  return nextItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const StudentRequestHistory = ({ studentDetail }) => {
  const navigation = useNavigation();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [modalVisible, setModalVisible] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (!studentDetail?.id) {
      return undefined;
    }

    const requestedQuery = query(
      collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
      where('status', '==', 'Requested')
    );

    const historyQuery = query(
      collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
      where('status', '!=', 'Requested')
    );

    const unsubscribeRequested = onSnapshot(requestedQuery, (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        displayDate: formatDate(item.data().createdAt),
      }));

      setPendingRequests(sortRequests(items, sortOption));
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        displayDate: formatDate(item.data().createdAt),
      }));

      setHistoryRequests(sortRequests(items, sortOption));
    });

    return () => {
      unsubscribeRequested();
      unsubscribeHistory();
    };
  }, [sortOption, studentDetail?.id]);

  const handleReject = async (item) => {
    try {
      setIsRejecting(true);

      const attendanceQuery = query(
        collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
        where('status', '==', 'Requested'),
        where('createdBy', '==', item.createdBy),
        where('createdAt', '==', item.createdAt),
        where('id', '==', item.id)
      );

      const snapshot = await getDocs(attendanceQuery);
      await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        await updateDoc(doc(firestore, `UserData/${studentDetail.id}/AttendanceRequests`, docSnapshot.id), {
          status: 'Rejected',
          ctime: new Date().toISOString(),
          locationLat: '',
          locationLong: '',
        });
      }));

      if (!item.teacherId) {
        throw new Error('Missing teacherId in request');
      }

      const teacherAttendanceQuery = item.requestId
        ? query(
            collection(firestore, `UserData/${item.teacherId}/AttendanceRequests`),
            where('requestId', '==', item.requestId)
          )
        : query(
            collection(firestore, `UserData/${item.teacherId}/AttendanceRequests`),
            where('createdAt', '==', item.createdAt),
            where('otp', '==', item.otp)
          );

      const teacherSnapshot = await getDocs(teacherAttendanceQuery);

      await Promise.all(teacherSnapshot.docs.map(async (requestDoc) => {
        const enrolledStudents = requestDoc.get('enrolledStudents') || [];
        const updatedStudents = enrolledStudents.map((student) => (
          student.email === auth.currentUser?.email
            ? { ...student, status: 'Rejected', ctime: new Date().toISOString(), locationLat: '', locationLong: '' }
            : student
        ));

        await updateDoc(doc(firestore, `UserData/${item.teacherId}/AttendanceRequests`, requestDoc.id), {
          enrolledStudents: updatedStudents,
          pendingNumberOfStudents: requestDoc.get('pendingNumberOfStudents') - 1,
        });
      }));

      Alert.alert('Rejected', 'Request rejected successfully.');
    } catch (error) {
      console.log('Error rejecting request:', error);
      Alert.alert('Error', error.message || 'Failed to reject request.');
    } finally {
      setIsRejecting(false);
    }
  };

  const activeList = activeTab === 'Pending' ? pendingRequests : historyRequests;

  const filteredList = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    return sortRequests(
      activeList.filter((item) =>
        `${item.subjectName} ${item.createdBy} ${item.status}`.toLowerCase().includes(queryText)
      ),
      sortOption
    );
  }, [activeList, searchQuery, sortOption]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.requestTop}>
              <View style={styles.requestCopy}>
                <Text style={styles.requestTitle}>{item.subjectName}</Text>
                <Text style={styles.requestMeta}>{item.createdBy} • {item.displayDate}</Text>
              </View>
              <View style={item.status === 'Requested' ? styles.badgePending : styles.badgeHistory}>
                <Text style={item.status === 'Requested' ? styles.badgePendingText : styles.badgeHistoryText}>
                  {item.status}
                </Text>
              </View>
            </View>

            {activeTab === 'Pending' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item)} disabled={isRejecting}>
                  <Text style={styles.rejectButtonText}>{isRejecting ? 'Rejecting...' : 'Reject'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={() => navigation.navigate('VerificationScreen', { requestDetails: item, studentDetail })}
                >
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroTitle}>Attendance Requests</Text>
                  <Text style={styles.heroSubtitle}>
                    Handle live verification requests and review your attendance history with less friction.
                  </Text>
                </View>
                <LottieView
                  source={require('../../assets/createReq.json')}
                  autoPlay
                  loop
                  style={styles.heroAnimation}
                />
              </View>
            </View>

            <View style={styles.tabRow}>
              {['Pending', 'History'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={activeTab === tab ? styles.activeTab : styles.inactiveTab}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color={Colors.SECONDARY} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search subject or teacher"
                  placeholderTextColor="#738393"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setModalVisible(true)}>
                <MaterialIcons name="tune" size={22} color={Colors.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No requests found</Text>
            <Text style={styles.emptySubtitle}>New attendance requests will appear here.</Text>
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Sort Requests</Text>
                {['Newest', 'Subject', 'Status'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.modalOption}
                    onPress={() => {
                      setSortOption(option);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{option}</Text>
                    <View style={sortOption === option ? styles.radioActive : styles.radioInactive} />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4F8',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: Colors.SECONDARY,
    borderRadius: 28,
    padding: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#DCE7EF',
    lineHeight: 20,
  },
  heroAnimation: {
    width: 120,
    height: 120,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  activeTab: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inactiveTab: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inactiveTabText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.PRIMARY,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 12,
  },
  requestTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  requestCopy: {
    flex: 1,
  },
  requestTitle: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
  requestMeta: {
    color: '#738393',
    marginTop: 5,
  },
  badgePending: {
    backgroundColor: '#EAF3EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeHistory: {
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgePendingText: {
    color: '#246E47',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeHistoryText: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FCECEC',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#B14141',
    fontWeight: '700',
  },
  verifyButton: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#748494',
    marginTop: 8,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 27, 39, 0.35)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 20,
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  modalOptionText: {
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  radioActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.PRIMARY,
  },
  radioInactive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#B3C1CC',
  },
});

export default StudentRequestHistory;
