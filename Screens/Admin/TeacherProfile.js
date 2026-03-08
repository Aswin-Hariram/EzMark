import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';
import {
  createDropdownItems,
  departmentOptions,
  getInstitutionData,
  saveInstitutionData,
} from './institutionData';

const TeacherProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const teacher = route.params?.teacher;
  const getTeachers = route.params?.getTeachers;
  const [teacherName, setTeacherName] = useState(teacher?.name || '');
  const [teacherEmail, setTeacherEmail] = useState(teacher?.email || '');
  const [department, setDepartment] = useState(teacher?.department || null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState(teacher?.classes || []);
  const [selectedSubjects, setSelectedSubjects] = useState(teacher?.subjects || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInstitution = async () => {
      try {
        const institution = await getInstitutionData();
        setAvailableClasses(institution.classes);
        setAvailableSubjects(institution.subjects);
      } catch (error) {
        console.log('Error loading teacher profile context:', error);
      }
    };

    loadInstitution();
  }, []);

  const classItems = useMemo(() => createDropdownItems(availableClasses), [availableClasses]);
  const subjectItems = useMemo(() => createDropdownItems(availableSubjects), [availableSubjects]);

  const toggleValue = (value, setter) => {
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const handleUpdate = async () => {
    if (!teacher?.id || !teacherName.trim() || !teacherEmail.trim()) {
      Alert.alert('Missing Fields', 'Teacher name and email are required.');
      return;
    }

    setLoading(true);

    try {
      const institution = await getInstitutionData();
      const nextClassDetails = institution.classDetails.map((classItem) => {
        const renamedTeachers = (classItem.teachers || []).map((item) => (item === teacher.name ? teacherName.trim() : item));
        const withoutTeacher = renamedTeachers.filter((item) => item !== teacher.name && item !== teacherName.trim());
        const shouldBeAssigned = selectedClasses.includes(classItem.name);
        const wasAdvisor = classItem.advisor === teacher.name || classItem.advisor === teacherName.trim();

        return {
          ...classItem,
          advisor: wasAdvisor ? (shouldBeAssigned ? teacherName.trim() : '') : classItem.advisor,
          teachers: shouldBeAssigned ? [...withoutTeacher, teacherName.trim()] : withoutTeacher,
        };
      });

      await updateDoc(doc(firestore, 'UserData', teacher.id), {
        name: teacherName.trim(),
        email: teacherEmail.trim().toLowerCase(),
        department: department || '',
        classes: selectedClasses,
        subjects: selectedSubjects,
      });
      await saveInstitutionData({
        classes: institution.classes,
        subjects: institution.subjects,
        classDetails: nextClassDetails,
      });
      Alert.alert('Success', 'Teacher updated successfully.');
      if (typeof getTeachers === 'function') {
        await getTeachers();
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error updating teacher:', error);
      Alert.alert('Error', error.message || 'Failed to update teacher.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!teacher?.id) {
      return;
    }

    Alert.alert('Delete Teacher', `Delete ${teacher.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const institution = await getInstitutionData();
            const nextClassDetails = institution.classDetails.map((classItem) => ({
              ...classItem,
              advisor: classItem.advisor === teacher.name ? '' : classItem.advisor,
              teachers: (classItem.teachers || []).filter((item) => item !== teacher.name),
            }));

            await deleteDoc(doc(firestore, 'UserData', teacher.id));
            await saveInstitutionData({
              classes: institution.classes,
              subjects: institution.subjects,
              classDetails: nextClassDetails,
            });
            Alert.alert('Success', 'Teacher deleted successfully.');
            if (typeof getTeachers === 'function') {
              await getTeachers();
            }
            navigation.goBack();
          } catch (error) {
            console.log('Error deleting teacher:', error);
            Alert.alert('Error', error.message || 'Failed to delete teacher.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Edit Teacher</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteIcon} onPress={handleDelete}>
            <MaterialIcons name="delete-outline" size={22} color="#B14141" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{teacher?.name || 'Teacher Profile'}</Text>
          <Text style={styles.heroSubtitle}>
            Update department ownership, class allocation, and subject coverage.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <TextInput
            label="Teacher Name"
            value={teacherName}
            onChangeText={setTeacherName}
            mode="outlined"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.input}
            left={<TextInput.Icon icon="account-outline" />}
          />
          <TextInput
            label="Teacher Email"
            value={teacherEmail}
            onChangeText={setTeacherEmail}
            mode="outlined"
            autoCapitalize="none"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.input}
            left={<TextInput.Icon icon="email-outline" />}
          />
          <View style={styles.dropdownContainer}>
            <MaterialIcons name="domain" size={22} color={Colors.PRIMARY} />
            <Dropdown
              style={styles.dropdown}
              data={departmentOptions}
              labelField="label"
              valueField="value"
              search
              placeholder="Select Department"
              value={department}
              onChange={(item) => setDepartment(item.value)}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Classes</Text>
          <View style={styles.chipWrap}>
            {classItems.length ? classItems.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={selectedClasses.includes(item.value) ? styles.selectedChip : styles.chip}
                onPress={() => toggleValue(item.value, setSelectedClasses)}
              >
                <Text style={selectedClasses.includes(item.value) ? styles.selectedChipText : styles.chipText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No classes available yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Subjects</Text>
          <View style={styles.chipWrap}>
            {subjectItems.length ? subjectItems.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={selectedSubjects.includes(item.value) ? styles.selectedChip : styles.chip}
                onPress={() => toggleValue(item.value, setSelectedSubjects)}
              >
                <Text style={selectedSubjects.includes(item.value) ? styles.selectedChipText : styles.chipText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No subjects available yet.</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Update Teacher</Text>
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
  content: {
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
  deleteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#D8E2EC',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.PRIMARY,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dropdown: {
    flex: 1,
    marginLeft: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EDF3F8',
  },
  selectedChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.PRIMARY,
  },
  chipText: {
    color: '#355164',
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    color: '#728292',
  },
  saveButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default TeacherProfile;
