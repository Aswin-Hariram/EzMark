import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';
import {
  createDropdownItems,
  departmentOptions,
  getInstitutionData,
  normalizeClassDetail,
  normalizeList,
  saveInstitutionData,
} from './institutionData';

const AddClass = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const existingClass = route.params?.existingClass;
  const isEditing = Boolean(existingClass?.name);
  const [className, setClassName] = useState(existingClass?.name || '');
  const [department, setDepartment] = useState(existingClass?.department || null);
  const [section, setSection] = useState(existingClass?.section || '');
  const [year, setYear] = useState(existingClass?.year || '');
  const [semester, setSemester] = useState(existingClass?.semester || '');
  const [capacity, setCapacity] = useState(existingClass?.capacity ? `${existingClass.capacity}` : '');
  const [advisor, setAdvisor] = useState(existingClass?.advisor || null);
  const [notes, setNotes] = useState(existingClass?.notes || '');
  const [selectedSubjects, setSelectedSubjects] = useState(existingClass?.subjects || []);
  const [selectedTeachers, setSelectedTeachers] = useState(existingClass?.teachers || []);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ subjects: subjectList }, teacherSnapshot] = await Promise.all([
          getInstitutionData(),
          getDocs(query(collection(firestore, 'UserData'), where('type', '==', 'Teacher'))),
        ]);

        setSubjects(subjectList);
        setTeachers(teacherSnapshot.docs.map((item) => item.data()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.log('Error loading class editor data:', error);
        Alert.alert('Error', 'Failed to load class editor data.');
      }
    };

    loadData();
  }, []);

  const teacherItems = useMemo(
    () => teachers.map((teacher) => ({ label: teacher.name, value: teacher.name })),
    [teachers]
  );
  const subjectItems = useMemo(() => createDropdownItems(subjects), [subjects]);

  const toggleValue = (value, setter) => {
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const syncLinkedUsers = async (nextClassName, nextTeachers) => {
    const batch = writeBatch(firestore);
    const previousClassName = existingClass?.name;
    const userSnapshot = await getDocs(collection(firestore, 'UserData'));

    userSnapshot.docs.forEach((userDoc) => {
      const user = userDoc.data();

      if (user.type === 'Teacher') {
        const currentClasses = normalizeList(user.classes || []);
        const removedOldName = previousClassName && previousClassName !== nextClassName
          ? currentClasses.filter((item) => item !== previousClassName)
          : currentClasses;
        const shouldContain = nextTeachers.includes(user.name);
        const nextClasses = shouldContain
          ? normalizeList([...removedOldName, nextClassName])
          : removedOldName.filter((item) => item !== nextClassName);

        if (JSON.stringify(nextClasses) !== JSON.stringify(currentClasses)) {
          batch.update(doc(firestore, 'UserData', userDoc.id), { classes: nextClasses });
        }
      }

      if (
        user.type === 'Student'
        && previousClassName
        && previousClassName !== nextClassName
        && user.class === previousClassName
      ) {
        batch.update(doc(firestore, 'UserData', userDoc.id), { class: nextClassName });
      }
    });

    await batch.commit();
  };

  const handleSave = async () => {
    const trimmedName = className.trim();
    if (!trimmedName || !department) {
      Alert.alert('Missing Fields', 'Class name and department are required.');
      return;
    }

    setLoading(true);

    try {
      const institution = await getInstitutionData();
      const duplicate = institution.classes.some(
        (item) => item.toLowerCase() === trimmedName.toLowerCase() && item !== existingClass?.name
      );

      if (duplicate) {
        Alert.alert('Duplicate Class', 'A class with this name already exists.');
        setLoading(false);
        return;
      }

      const updatedClass = normalizeClassDetail({
        ...existingClass,
        name: trimmedName,
        department,
        section,
        year,
        semester,
        advisor: advisor || '',
        capacity: capacity ? Number(capacity) : 0,
        teachers: normalizeList(selectedTeachers),
        subjects: normalizeList(selectedSubjects),
        notes,
      });

      const nextClassDetails = institution.classDetails
        .filter((item) => item.name !== existingClass?.name)
        .concat(updatedClass)
        .sort((a, b) => a.name.localeCompare(b.name));

      await saveInstitutionData({
        classes: nextClassDetails.map((item) => item.name),
        subjects: institution.subjects,
        classDetails: nextClassDetails,
      });

      await syncLinkedUsers(updatedClass.name, updatedClass.teachers);

      Alert.alert('Success', isEditing ? 'Class updated successfully.' : 'Class created successfully.');
      navigation.goBack();
    } catch (error) {
      console.log('Error saving class:', error);
      Alert.alert('Error', error.message || 'Failed to save class.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>{isEditing ? 'Edit Class' : 'Create Class'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Institution class setup</Text>
          <Text style={styles.heroSubtitle}>
            Define ownership, teaching staff, subject coverage, and delivery metadata in one place.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Core Details</Text>
          <TextInput
            label="Class Name"
            mode="outlined"
            value={className}
            onChangeText={setClassName}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.input}
            left={<TextInput.Icon icon="google-classroom" />}
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
          <View style={styles.inlineFields}>
            <TextInput
              label="Section"
              mode="outlined"
              value={section}
              onChangeText={setSection}
              activeOutlineColor={Colors.PRIMARY}
              outlineColor={Colors.SECONDARY}
              style={[styles.input, styles.inlineInput]}
            />
            <TextInput
              label="Year"
              mode="outlined"
              value={year}
              onChangeText={setYear}
              activeOutlineColor={Colors.PRIMARY}
              outlineColor={Colors.SECONDARY}
              style={[styles.input, styles.inlineInput]}
            />
          </View>
          <View style={styles.inlineFields}>
            <TextInput
              label="Semester"
              mode="outlined"
              value={semester}
              onChangeText={setSemester}
              activeOutlineColor={Colors.PRIMARY}
              outlineColor={Colors.SECONDARY}
              style={[styles.input, styles.inlineInput]}
            />
            <TextInput
              label="Capacity"
              mode="outlined"
              value={capacity}
              keyboardType="numeric"
              onChangeText={setCapacity}
              activeOutlineColor={Colors.PRIMARY}
              outlineColor={Colors.SECONDARY}
              style={[styles.input, styles.inlineInput]}
            />
          </View>
          <View style={styles.dropdownContainer}>
            <MaterialIcons name="supervisor-account" size={22} color={Colors.PRIMARY} />
            <Dropdown
              style={styles.dropdown}
              data={teacherItems}
              labelField="label"
              valueField="value"
              search
              placeholder="Select Class Advisor"
              value={advisor}
              onChange={(item) => setAdvisor(item.value)}
            />
          </View>
          <TextInput
            label="Operational Notes"
            mode="outlined"
            value={notes}
            onChangeText={setNotes}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            multiline
            numberOfLines={4}
            style={styles.input}
          />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Teachers</Text>
          <Text style={styles.sectionHint}>Use this to keep teacher profiles synced with class allocation.</Text>
          <View style={styles.chipContainer}>
            {teacherItems.length ? teacherItems.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={selectedTeachers.includes(item.value) ? styles.selectedChip : styles.chip}
                onPress={() => toggleValue(item.value, setSelectedTeachers)}
              >
                <Text style={selectedTeachers.includes(item.value) ? styles.selectedChipText : styles.chipText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No teachers available yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mapped Subjects</Text>
          <Text style={styles.sectionHint}>Subjects here describe what is delivered for this class.</Text>
          <View style={styles.chipContainer}>
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

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Update Class' : 'Create Class'}</Text>
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
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  scrollView: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  header: {
    height: 56,
    justifyContent: 'center',
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.PRIMARY,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#5F7382',
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
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6E7E8E',
    marginBottom: 12,
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
    marginBottom: 12,
  },
  dropdown: {
    flex: 1,
    marginLeft: 10,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 12,
  },
  inlineInput: {
    flex: 1,
  },
  chipContainer: {
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
    color: '#738496',
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddClass;
