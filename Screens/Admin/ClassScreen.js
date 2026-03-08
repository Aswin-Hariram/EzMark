import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import { ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';
import { getInstitutionData, saveInstitutionData } from './institutionData';

const ClassScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const initialClass = route.params?.classItem;
  const className = initialClass?.name;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [details, setDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const loadClass = useCallback(async () => {
    if (!className) {
      setLoading(false);
      return;
    }

    try {
      const [institution, userSnapshot] = await Promise.all([
        getInstitutionData(),
        getDocs(collection(firestore, 'UserData')),
      ]);

      const users = userSnapshot.docs.map((item) => item.data());
      const nextDetails = institution.classDetails.find((item) => item.name === className);
      const linkedStudents = users.filter((item) => item.type === 'Student' && item.class === className);
      const linkedTeachers = users.filter((item) => item.type === 'Teacher' && (item.classes || []).includes(className));

      setDetails(nextDetails || initialClass);
      setStudents(linkedStudents);
      setTeachers(linkedTeachers);
    } catch (error) {
      console.log('Error loading class detail:', error);
    } finally {
      setLoading(false);
    }
  }, [className, initialClass]);

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [loadClass])
  );

  const occupancy = useMemo(() => {
    if (!details?.capacity) {
      return 0;
    }
    return Math.min(100, Math.round((students.length / details.capacity) * 100));
  }, [details?.capacity, students.length]);

  const handleDelete = () => {
    if (!details?.name) {
      return;
    }

    Alert.alert(
      'Delete Class',
      `Delete ${details.name}? Linked teacher assignments will be updated and students will be left unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);

            try {
              const institution = await getInstitutionData();
              const batch = writeBatch(firestore);
              const nextClassDetails = institution.classDetails.filter((item) => item.name !== details.name);
              const userSnapshot = await getDocs(collection(firestore, 'UserData'));

              userSnapshot.docs.forEach((item) => {
                const data = item.data();

                if (data.type === 'Teacher' && (data.classes || []).includes(details.name)) {
                  batch.update(doc(firestore, 'UserData', item.id), {
                    classes: (data.classes || []).filter((value) => value !== details.name),
                  });
                }

                if (data.type === 'Student' && data.class === details.name) {
                  batch.update(doc(firestore, 'UserData', item.id), {
                    class: '',
                  });
                }
              });

              await saveInstitutionData({
                classes: nextClassDetails.map((item) => item.name),
                subjects: institution.subjects,
                classDetails: nextClassDetails,
              });
              await batch.commit();

              Alert.alert('Success', 'Class deleted successfully.');
              navigation.goBack();
            } catch (error) {
              console.log('Error deleting class:', error);
              Alert.alert('Error', error.message || 'Failed to delete class.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </SafeAreaView>
    );
  }

  if (!details) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.emptyTitle}>Class not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Class Details</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editAction} onPress={() => navigation.navigate('AddClass', { existingClass: details })}>
            <MaterialIcons name="edit" size={20} color="#fff" />
            <Text style={styles.editActionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{details.name}</Text>
          <Text style={styles.heroSubtitle}>{details.department || 'Department pending'}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{students.length}</Text>
              <Text style={styles.heroMetaLabel}>Students</Text>
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{teachers.length}</Text>
              <Text style={styles.heroMetaLabel}>Teachers</Text>
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{(details.subjects || []).length}</Text>
              <Text style={styles.heroMetaLabel}>Subjects</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Operational Readiness</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Advisor</Text>
              <Text style={styles.infoValue}>{details.advisor || 'Unassigned'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Section</Text>
              <Text style={styles.infoValue}>{details.section || '-'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Year</Text>
              <Text style={styles.infoValue}>{details.year || '-'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Semester</Text>
              <Text style={styles.infoValue}>{details.semester || '-'}</Text>
            </View>
          </View>

          <View style={styles.capacityBlock}>
            <View style={styles.capacityHeader}>
              <Text style={styles.infoLabel}>Occupancy</Text>
              <Text style={styles.infoValue}>
                {details.capacity ? `${students.length}/${details.capacity}` : `${students.length}`}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${occupancy}%` }]} />
            </View>
          </View>

          {details.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.notesText}>{details.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mapped Subjects</Text>
          <View style={styles.chipWrap}>
            {(details.subjects || []).length ? details.subjects.map((subject) => (
              <View key={subject} style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{subject}</Text>
              </View>
            )) : (
              <Text style={styles.emptyDetailText}>No subjects mapped.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Teaching Team</Text>
          {teachers.length ? teachers.map((teacher) => (
            <View key={teacher.id} style={styles.listRow}>
              <View>
                <Text style={styles.listTitle}>{teacher.name}</Text>
                <Text style={styles.listSubtitle}>{teacher.department}</Text>
              </View>
              <Entypo name="dot-single" size={22} color={Colors.SECONDARY} />
            </View>
          )) : (
            <Text style={styles.emptyDetailText}>No teachers assigned yet.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Student Cohort</Text>
          {students.length ? students.slice(0, 8).map((student) => (
            <View key={student.id} style={styles.listRow}>
              <View>
                <Text style={styles.listTitle}>{student.name}</Text>
                <Text style={styles.listSubtitle}>{student.rollno}</Text>
              </View>
              <Text style={styles.classBadge}>{student.department}</Text>
            </View>
          )) : (
            <Text style={styles.emptyDetailText}>No students assigned yet.</Text>
          )}
          {students.length > 8 ? (
            <Text style={styles.moreText}>{students.length - 8} more students linked to this class.</Text>
          ) : null}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Class</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  editAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.PRIMARY,
  },
  editActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    marginTop: 6,
    color: '#D6E0EA',
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroMeta: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 14,
  },
  heroMetaValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroMetaLabel: {
    color: '#D6E0EA',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.PRIMARY,
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoBox: {
    width: '47%',
    backgroundColor: '#F4F7FB',
    borderRadius: 18,
    padding: 14,
  },
  infoLabel: {
    color: '#6C7E8D',
    marginBottom: 6,
  },
  infoValue: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  capacityBlock: {
    marginTop: 16,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E8EEF3',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.SECONDARY,
  },
  notesBox: {
    marginTop: 16,
    backgroundColor: '#F4F7FB',
    borderRadius: 18,
    padding: 14,
  },
  notesText: {
    color: '#425D70',
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    borderRadius: 999,
    backgroundColor: '#EAF0F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subjectChipText: {
    color: '#365163',
    fontWeight: '600',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  listSubtitle: {
    marginTop: 4,
    color: '#6C7E8D',
  },
  classBadge: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyDetailText: {
    color: '#6F8190',
  },
  moreText: {
    marginTop: 12,
    color: Colors.SECONDARY,
    fontWeight: '600',
  },
  deleteButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#C64747',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
});

export default ClassScreen;
