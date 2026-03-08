import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import CPB from '../../Components/CPB';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';

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

const sortRequestList = (items, sortOption) => {
  const nextItems = [...items];

  if (sortOption === 'Class') {
    return nextItems.sort((a, b) => (a.class || '').localeCompare(b.class || ''));
  }
  if (sortOption === 'Subject') {
    return nextItems.sort((a, b) => (a.subjectName || '').localeCompare(b.subjectName || ''));
  }
  if (sortOption === 'Completion') {
    return nextItems.sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  }

  return nextItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const TeacherHistory = ({ teacherDetail }) => {
  const navigation = useNavigation();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Newest');
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState(null);

  useEffect(() => {
    if (!teacherDetail?.id) {
      return undefined;
    }

    const pendingQuery = query(
      collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`),
      where('status', '==', 'Requested')
    );

    const historyQuery = query(
      collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`),
      where('status', '!=', 'Requested')
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const records = snapshot.docs.map((item) => {
        const data = item.data();
        const total = Number(data.totalNumberOfStudents || 0);
        const pending = Number(data.pendingNumberOfStudents || 0);

        return {
          id: item.id,
          ...data,
          displayDate: formatDate(data.createdAt),
          percentage: total ? ((total - pending) / total) * 100 : 0,
        };
      });

      setPendingRequests(sortRequestList(records, sortOption));
    });

    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const records = snapshot.docs.map((item) => {
        const data = item.data();
        const total = Number(data.totalNumberOfStudents || 0);
        const pending = Number(data.pendingNumberOfStudents || 0);

        return {
          id: item.id,
          ...data,
          displayDate: formatDate(data.createdAt),
          percentage: total ? ((total - pending) / total) * 100 : 0,
        };
      });

      setHistoryRequests(sortRequestList(records, sortOption));
    });

    return () => {
      unsubscribePending();
      unsubscribeHistory();
    };
  }, [sortOption, teacherDetail?.id]);

  const handleComplete = async (item) => {
    try {
      setLoadingId(item.id);

      const studentQuery = query(
        collection(firestore, 'UserData'),
        where('class', '==', item.class || ''),
        where('type', '==', 'Student')
      );

      const querySnapshot = await getDocs(studentQuery);
      if (querySnapshot.empty) {
        Alert.alert('No Students Found', `No students enrolled in class: ${item.class}`);
        return;
      }

      for (const userDoc of querySnapshot.docs) {
        const reqQuery = query(
          collection(firestore, `UserData/${userDoc.id}/AttendanceRequests`),
          where('status', '==', 'Requested'),
          where('createdAt', '==', item.createdAt),
          where('class', '==', item.class),
          where('createdBy', '==', item.createdBy),
          where('subjectName', '==', item.subjectName)
        );

        const snap = await getDocs(reqQuery);
        await Promise.all(
          snap.docs.map((requestDoc) =>
            updateDoc(doc(firestore, `UserData/${userDoc.id}/AttendanceRequests`, requestDoc.id), {
              status: 'Closed',
            })
          )
        );
      }

      const updatedStudents = (item.enrolledStudents || []).map((student) =>
        student.status === 'Requested' ? { ...student, status: 'Closed' } : student
      );

      await updateDoc(doc(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`, item.id), {
        status: 'Closed',
        enrolledStudents: updatedStudents,
      });

      Alert.alert('Completed', 'Attendance request closed successfully.');
    } catch (error) {
      console.log('Error completing request:', error);
      Alert.alert('Error', error.message || 'Failed to close request.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (item) => {
    try {
      setLoadingDeleteId(item.id);

      const studentQuery = query(
        collection(firestore, 'UserData'),
        where('class', '==', item.class || ''),
        where('type', '==', 'Student')
      );

      const querySnapshot = await getDocs(studentQuery);
      if (querySnapshot.empty) {
        Alert.alert('No Students Found', `No students enrolled in class: ${item.class}`);
        return;
      }

      for (const userDoc of querySnapshot.docs) {
        const reqQuery = query(
          collection(firestore, `UserData/${userDoc.id}/AttendanceRequests`),
          where('status', '==', 'Requested'),
          where('createdAt', '==', item.createdAt),
          where('class', '==', item.class),
          where('createdBy', '==', item.createdBy),
          where('subjectName', '==', item.subjectName)
        );

        const snap = await getDocs(reqQuery);
        await Promise.all(
          snap.docs.map((requestDoc) =>
            deleteDoc(doc(firestore, `UserData/${userDoc.id}/AttendanceRequests`, requestDoc.id))
          )
        );
      }

      await deleteDoc(doc(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`, item.id));
      Alert.alert('Deleted', 'Attendance request deleted successfully.');
    } catch (error) {
      console.log('Error deleting request:', error);
      Alert.alert('Error', error.message || 'Failed to delete request.');
    } finally {
      setLoadingDeleteId(null);
    }
  };

  const activeList = activeTab === 'Pending' ? pendingRequests : historyRequests;

  const filteredList = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    const searched = activeList.filter((item) =>
      `${item.class} ${item.subjectName} ${item.createdBy} ${item.status}`.toLowerCase().includes(queryText)
    );

    return sortRequestList(searched, sortOption);
  }, [activeList, searchQuery, sortOption]);

  const summary = useMemo(() => ({
    pending: pendingRequests.length,
    history: historyRequests.length,
    avgCompletion: activeList.length
      ? Math.round(activeList.reduce((sum, item) => sum + (item.percentage || 0), 0) / activeList.length)
      : 0,
  }), [activeList, historyRequests.length, pendingRequests.length]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => navigation.navigate('RequestDetails', {
              requestDetails: item,
              type: activeTab === 'Pending' ? 'Pending' : 'History',
              teacherDetail,
            })}
          >
            <View style={styles.requestTopRow}>
              <View style={styles.requestCopy}>
                <View style={activeTab === 'Pending' ? styles.badgeLive : styles.badgeHistory}>
                  <Text style={activeTab === 'Pending' ? styles.badgeTextLive : styles.badgeTextHistory}>
                    {item.status}
                  </Text>
                </View>
                <Text style={styles.requestTitle}>{item.class} • {item.subjectName}</Text>
                <Text style={styles.requestSubtitle}>{item.displayDate}</Text>
              </View>
              <CPB
                percentage={item.percentage || 0}
                size={70}
                strokeWidth={6}
                tsize={14}
                color={Colors.SECONDARY}
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.totalNumberOfStudents || 0} students</Text>
              <Text style={styles.metaText}>{item.pendingNumberOfStudents || 0} pending</Text>
            </View>

            {activeTab === 'Pending' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleCancel(item)}
                  disabled={loadingDeleteId === item.id}
                >
                  <Text style={styles.deleteButtonText}>
                    {loadingDeleteId === item.id ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleComplete(item)}
                  disabled={loadingId === item.id}
                >
                  <Text style={styles.completeButtonText}>
                    {loadingId === item.id ? 'Completing...' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroTitle}>Request Control</Text>
                  <Text style={styles.heroSubtitle}>
                    Watch live attendance progress and close sessions without digging through lists.
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

            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.pending}</Text>
                <Text style={styles.metricLabel}>Pending</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.history}</Text>
                <Text style={styles.metricLabel}>History</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.avgCompletion}%</Text>
                <Text style={styles.metricLabel}>Avg Progress</Text>
              </View>
            </View>

            <View style={styles.tabRow}>
              {['Pending', 'History'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={activeTab === tab ? styles.activeTab : styles.inactiveTab}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.controlsRow}>
              <View style={styles.searchBar}>
                <Feather name="search" size={18} color={Colors.SECONDARY} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search class or subject"
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
            <Text style={styles.emptySubtitle}>Create a request to start tracking attendance progress.</Text>
          </View>
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateRequest', { teacherDetail })}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Sort Requests</Text>
                {['Newest', 'Class', 'Subject', 'Completion'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.modalOption}
                    onPress={() => {
                      setSortOption(item);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                    <View style={sortOption === item ? styles.radioActive : styles.radioInactive} />
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
    backgroundColor: '#F4F7FB',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
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
    color: '#DDE7EF',
    lineHeight: 20,
  },
  heroAnimation: {
    width: 120,
    height: 120,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  metricLabel: {
    marginTop: 4,
    color: '#6F7F8E',
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
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
  },
  requestCopy: {
    flex: 1,
  },
  badgeLive: {
    alignSelf: 'flex-start',
    backgroundColor: '#E7F2EA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  badgeHistory: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  badgeTextLive: {
    color: '#237646',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeTextHistory: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  requestSubtitle: {
    marginTop: 4,
    color: '#708191',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaText: {
    color: '#5E7281',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FCECEC',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#B14141',
    fontWeight: '700',
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#728292',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY,
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
    fontSize: 20,
    fontWeight: '800',
    color: Colors.PRIMARY,
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

export default TeacherHistory;
