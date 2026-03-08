import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';
import { getInstitutionData, normalizeList, saveInstitutionData } from './institutionData';

const ManageSubjects = ({ embedded = false }) => {
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectName, setSubjectName] = useState('');
  const Container = embedded ? View : SafeAreaView;

  const loadSubjects = useCallback(async () => {
    try {
      const [institution, userSnapshot] = await Promise.all([
        getInstitutionData(),
        getDocs(collection(firestore, 'UserData')),
      ]);

      const users = userSnapshot.docs.map((item) => item.data());
      const teachers = users.filter((item) => item.type === 'Teacher');
      const students = users.filter((item) => item.type === 'Student');

      const records = institution.subjects.map((subject) => ({
        name: subject,
        teacherCount: teachers.filter((teacher) => (teacher.subjects || []).includes(subject)).length,
        studentCount: students.filter((student) => (student.subjects || []).includes(subject)).length,
        classCount: institution.classDetails.filter((classItem) => (classItem.subjects || []).includes(subject)).length,
      }));

      setSubjects(records.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.log('Error loading subjects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  const summary = useMemo(() => ({
    total: subjects.length,
    active: subjects.filter((item) => item.classCount > 0).length,
    unassigned: subjects.filter((item) => item.classCount === 0).length,
  }), [subjects]);

  const filteredSubjects = useMemo(
    () => subjects.filter((item) => item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())),
    [searchQuery, subjects]
  );

  const openCreateModal = () => {
    setEditingSubject(null);
    setSubjectName('');
    setModalVisible(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setSubjectName(subject.name);
    setModalVisible(true);
  };

  const handleSaveSubject = async () => {
    const trimmedName = subjectName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      const institution = await getInstitutionData();
      const duplicate = institution.subjects.some(
        (item) => item.toLowerCase() === trimmedName.toLowerCase() && item !== editingSubject?.name
      );

      if (duplicate) {
        Alert.alert('Duplicate Subject', 'A subject with this name already exists.');
        return;
      }

      let nextSubjects;
      let nextClassDetails = institution.classDetails;
      const batch = writeBatch(firestore);

      if (editingSubject?.name) {
        nextSubjects = normalizeList(
          institution.subjects.map((item) => (item === editingSubject.name ? trimmedName : item))
        );
        nextClassDetails = institution.classDetails.map((classItem) => ({
          ...classItem,
          subjects: normalizeList(
            (classItem.subjects || []).map((item) => (item === editingSubject.name ? trimmedName : item))
          ),
        }));

        const userSnapshot = await getDocs(collection(firestore, 'UserData'));
        userSnapshot.docs.forEach((item) => {
          const data = item.data();
          if ((data.subjects || []).includes(editingSubject.name)) {
            batch.update(doc(firestore, 'UserData', item.id), {
              subjects: normalizeList(
                (data.subjects || []).map((subject) => (subject === editingSubject.name ? trimmedName : subject))
              ),
            });
          }
        });
        await batch.commit();
      } else {
        nextSubjects = normalizeList([...institution.subjects, trimmedName]);
      }

      await saveInstitutionData({
        classes: institution.classes,
        subjects: nextSubjects,
        classDetails: nextClassDetails,
      });

      setModalVisible(false);
      setSubjectName('');
      setEditingSubject(null);
      loadSubjects();
      Alert.alert('Success', editingSubject ? 'Subject updated successfully.' : 'Subject created successfully.');
    } catch (error) {
      console.log('Error saving subject:', error);
      Alert.alert('Error', error.message || 'Failed to save subject.');
    }
  };

  const handleDeleteSubject = (subject) => {
    const target = subject.name;

    Alert.alert(
      'Delete Subject',
      `Delete ${target}? It will be removed from mapped classes, teachers, and students.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setModalVisible(false);
            try {
              const institution = await getInstitutionData();
              const nextSubjects = institution.subjects.filter((item) => item !== target);
              const nextClassDetails = institution.classDetails.map((classItem) => ({
                ...classItem,
                subjects: (classItem.subjects || []).filter((item) => item !== target),
              }));
              const batch = writeBatch(firestore);
              const userSnapshot = await getDocs(collection(firestore, 'UserData'));

              userSnapshot.docs.forEach((item) => {
                const data = item.data();
                if ((data.subjects || []).includes(target)) {
                  batch.update(doc(firestore, 'UserData', item.id), {
                    subjects: (data.subjects || []).filter((value) => value !== target),
                  });
                }
              });

              await saveInstitutionData({
                classes: institution.classes,
                subjects: nextSubjects,
                classDetails: nextClassDetails,
              });
              await batch.commit();
              loadSubjects();
              Alert.alert('Success', 'Subject deleted successfully.');
            } catch (error) {
              console.log('Error deleting subject:', error);
              Alert.alert('Error', error.message || 'Failed to delete subject.');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View>
      <View style={[styles.hero, embedded && styles.embeddedHero]}>
        <Text style={styles.heroTitle}>Subject Catalog</Text>
        <Text style={styles.heroSubtitle}>
          Keep the institution subject list consistent across classes, teachers, and students.
        </Text>
        <TouchableOpacity style={styles.addButtonInline} onPress={openCreateModal}>
          <MaterialIcons name="playlist-add" size={22} color="#fff" />
          <Text style={styles.addButtonInlineText}>Add Subject</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.total}</Text>
          <Text style={styles.metricLabel}>Subjects</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.active}</Text>
          <Text style={styles.metricLabel}>Mapped</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.unassigned}</Text>
          <Text style={styles.metricLabel}>Unused</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search subjects"
          placeholderTextColor="#6F8090"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  return (
    <Container style={styles.container}>
      <FlatList
        data={filteredSubjects}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.subjectCard} onPress={() => openEditModal(item)}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{item.name}</Text>
              <Entypo name="chevron-right" size={20} color={Colors.PRIMARY} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{item.classCount}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{item.teacherCount}</Text>
                <Text style={styles.statLabel}>Teachers</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statValue}>{item.studentCount}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No subjects found</Text>
              <Text style={styles.emptySubtitle}>Add subjects to start mapping academic coverage.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSubjects();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.floatingButton} onPress={openCreateModal}>
        <Entypo name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{editingSubject ? 'Edit Subject' : 'Add Subject'}</Text>
                <TextInput
                  value={subjectName}
                  onChangeText={setSubjectName}
                  placeholder="Subject name"
                  placeholderTextColor="#7B8B99"
                  style={styles.modalInput}
                />

                <TouchableOpacity style={styles.modalPrimaryButton} onPress={handleSaveSubject}>
                  <Text style={styles.modalPrimaryButtonText}>
                    {editingSubject ? 'Save Changes' : 'Create Subject'}
                  </Text>
                </TouchableOpacity>

                {editingSubject ? (
                  <TouchableOpacity style={styles.modalDangerButton} onPress={() => handleDeleteSubject(editingSubject)}>
                    <Text style={styles.modalDangerText}>Delete Subject</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  hero: {
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 28,
    backgroundColor: Colors.SECONDARY,
  },
  embeddedHero: {
    marginTop: 0,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#DDE7EF',
    lineHeight: 20,
    marginBottom: 14,
  },
  addButtonInline: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonInlineText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  metricLabel: {
    color: '#607181',
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.PRIMARY,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    borderRadius: 18,
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  statLabel: {
    color: '#6E7E8E',
    marginTop: 4,
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
    textAlign: 'center',
    color: '#6B7C8D',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.SECONDARY,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 31, 44, 0.35)',
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
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#F4F7FB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.PRIMARY,
    marginBottom: 14,
  },
  modalPrimaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalDangerButton: {
    height: 50,
    borderRadius: 18,
    backgroundColor: '#F8E6E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  modalDangerText: {
    color: '#B13A3A',
    fontWeight: '700',
  },
});

export default ManageSubjects;
