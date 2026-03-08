import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore, secondaryAuth } from '../../Config/FirebaseConfig';
import { s3 } from '../../Config/awsConfig';
import {
  createDropdownItems,
  departmentOptions,
  getInstitutionData,
} from './institutionData';

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

const AddStudent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const getStudents = route.params?.getStudents;
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentRollno, setStudentRollno] = useState('');
  const [studentDepartment, setStudentDepartment] = useState(null);
  const [studentPassword, setStudentPassword] = useState('');
  const [studentClass, setStudentClass] = useState(null);
  const [studentImage, setStudentImage] = useState(null);
  const [subjectsSelected, setSubjectsSelected] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const institution = await getInstitutionData();
        setClasses(institution.classes);
        setSubjects(institution.subjects);
      } catch (error) {
        console.log('Error fetching institution:', error);
        Alert.alert('Error', 'Failed to load classes and subjects.');
      }
    };

    fetchInstitution();
  }, []);

  const classItems = useMemo(() => createDropdownItems(classes), [classes]);
  const subjectItems = useMemo(() => createDropdownItems(subjects), [subjects]);

  const validateInput = () => {
    if (!studentName.trim() || !studentEmail.trim() || !studentDepartment || !studentClass || !studentRollno.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return false;
    }

    if (!emailRegex.test(studentEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!passwordRegex.test(studentPassword.trim())) {
      Alert.alert(
        'Weak Password',
        'Password must include at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number.'
      );
      return false;
    }

    return true;
  };

  const checkIfRollnoExists = async () => {
    const studentQuery = query(collection(firestore, 'UserData'), where('rollno', '==', studentRollno.trim()));
    const querySnapshot = await getDocs(studentQuery);
    return !querySnapshot.empty;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setStudentImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  };

  const uploadImageToS3 = async (uri) => {
    if (!uri) {
      return '';
    }

    try {
      const fileName = uri.split('/').pop() || `${Date.now()}.jpg`;
      const fileType = fileName.split('.').pop();
      const buffer = await fetch(uri).then((response) => response.arrayBuffer());
      const params = {
        Bucket: 'ezmarkskct',
        Key: `students/${studentEmail || Date.now()}-${fileName}`,
        Body: Buffer.from(buffer),
        ContentType: `image/${fileType}`,
      };
      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.log('Error uploading student image:', error);
      Alert.alert('Error', 'Failed to upload student image.');
      return null;
    }
  };

  const toggleSubject = (subject) => {
    setSubjectsSelected((previous) =>
      previous.includes(subject)
        ? previous.filter((item) => item !== subject)
        : [...previous, subject]
    );
  };

  const handleSaveStudent = async () => {
    if (!validateInput()) {
      return;
    }

    setProcessing(true);

    try {
      const rollnoExists = await checkIfRollnoExists();
      if (rollnoExists) {
        Alert.alert('Duplicate Roll Number', 'This roll number is already used by another student.');
        setProcessing(false);
        return;
      }

      const imageUrl = await uploadImageToS3(studentImage);
      if (imageUrl === null) {
        setProcessing(false);
        return;
      }

      const newStudent = {
        id: Date.now().toString(),
        name: studentName.trim(),
        email: studentEmail.trim().toLowerCase(),
        department: studentDepartment,
        image: imageUrl || '',
        class: studentClass,
        rollno: studentRollno.trim(),
        password: studentPassword.trim(),
        type: 'Student',
        subjects: subjectsSelected,
      };

      await createUserWithEmailAndPassword(
        secondaryAuth,
        newStudent.email,
        newStudent.password
      );
      await setDoc(doc(firestore, 'UserData', newStudent.id), newStudent);
      await secondaryAuth.signOut();

      Alert.alert('Success', 'Student added successfully.');
      if (typeof getStudents === 'function') {
        await getStudents();
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error saving student:', error);
      Alert.alert('Error', error.message || 'Failed to add student.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Add Student</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Create student profile</Text>
            <Text style={styles.heroSubtitle}>
              Map the learner to class and subjects now so attendance requests target the right cohort.
            </Text>
          </View>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {studentImage ? (
              <Image source={{ uri: studentImage }} style={styles.studentImage} />
            ) : (
              <View style={styles.imagePlaceholderWrap}>
                <Ionicons name="camera-outline" size={24} color={Colors.SECONDARY} />
                <Text style={styles.imagePlaceholder}>Upload</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <TextInput
            label="Student Name"
            value={studentName}
            onChangeText={setStudentName}
            mode="outlined"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="account-outline" />}
          />
          <TextInput
            label="Student Email"
            value={studentEmail}
            onChangeText={setStudentEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="email-outline" />}
          />
          <TextInput
            label="Roll Number"
            value={studentRollno}
            onChangeText={setStudentRollno}
            mode="outlined"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="numeric" />}
          />
          <TextInput
            label="Password"
            value={studentPassword}
            onChangeText={setStudentPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye' : 'eye-off'}
                onPress={() => setShowPassword((previous) => !previous)}
              />
            }
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
              value={studentDepartment}
              onChange={(item) => setStudentDepartment(item.value)}
            />
          </View>

          <View style={styles.dropdownContainer}>
            <MaterialIcons name="class" size={22} color={Colors.PRIMARY} />
            <Dropdown
              style={styles.dropdown}
              data={classItems}
              labelField="label"
              valueField="value"
              search
              placeholder="Select Class"
              value={studentClass}
              onChange={(item) => setStudentClass(item.value)}
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Subject Enrollment</Text>
          <View style={styles.dropdownContainer}>
            <AntDesign name="book" size={20} color={Colors.PRIMARY} />
            <Dropdown
              style={styles.dropdown}
              data={subjectItems}
              labelField="label"
              valueField="value"
              search
              placeholder="Add Subject"
              onChange={(item) => toggleSubject(item.value)}
            />
          </View>

          <View style={styles.chipContainer}>
            {subjectsSelected.length ? subjectsSelected.map((subject) => (
              <TouchableOpacity
                key={subject}
                style={styles.selectedChip}
                onPress={() => toggleSubject(subject)}
              >
                <Text style={styles.selectedChipText}>{subject}</Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No subjects selected yet.</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveStudent} disabled={processing}>
          {processing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Student</Text>
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
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.PRIMARY,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5F7382',
  },
  imagePicker: {
    width: 94,
    height: 94,
    borderRadius: 22,
    backgroundColor: '#E9EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  studentImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderWrap: {
    alignItems: 'center',
    gap: 6,
  },
  imagePlaceholder: {
    color: Colors.SECONDARY,
    fontWeight: '600',
  },
  formCard: {
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
  inputField: {
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  selectedChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.PRIMARY,
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

export default AddStudent;
