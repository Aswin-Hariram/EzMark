import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import dp from '../../assets/Teachers/profile.png';
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { Dropdown } from 'react-native-element-dropdown';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { s3 } from '../../Config/awsConfig';

const StudentProfile = ({ route }) => {
  const { student, getStudent } = route.params;
  const navigation = useNavigation();

  const [studentName, setStudentName] = useState(student.name);
  const [studentEmail, setStudentEmail] = useState(student.email);
  const [studentDepartment, setStudentDepartment] = useState(student.department);
  const [studentRollNo, setStudentRollNo] = useState(student.rollno);
  const [classes, setClasses] = useState([]);
  const [studentClass, setStudentClass] = useState(student.class);
  const [isUpdating, setIsUpdating] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectsSelected, setSubjectsSelected] = useState(student.subjects || []);
  const [studentProfile, setStudentProfile] = useState(student.image);
  const [imageLoading, setImageLoading] = useState(false);

  const s3BucketName = 'ezmarkbucket'; // Replace with your S3 bucket name

  const deleteFromFirestore = async () => {
    setIsUpdating(true);
    try {
      await deleteDoc(doc(firestore, 'UserData', student.id));
      Alert.alert('Success', 'Student deleted successfully.');
      getStudent();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete student.');
      console.error('Error deleting student:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Confirm', 'Do you want to delete this student?', [
      { text: 'Yes', onPress: deleteFromFirestore },
      { text: 'No' },
    ]);
  };

  const updateStudentInFirestore = async (updatedStudent) => {
    try {
      const studentRef = doc(firestore, 'UserData', student.id);
      await updateDoc(studentRef, updatedStudent);
      Alert.alert('Success', 'Student details updated successfully.');
      getStudent();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update student details.');
      console.error('Error updating student:', error);
    }
  };

  const validateInput = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!studentName || !studentEmail || !studentDepartment || !studentClass || !studentRollNo) {
      Alert.alert('Error', 'Please fill out all fields.');
      return false;
    }
    if (!emailRegex.test(studentEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleUpdate = async () => {
    if (!validateInput()) return;
    setIsUpdating(true);
    const updatedStudent = {
      name: studentName,
      email: studentEmail,
      department: studentDepartment,
      rollno: studentRollNo,
      class: studentClass,
      image: studentProfile,
      subjects: subjectsSelected,
    };
    await updateStudentInFirestore(updatedStudent);
    setIsUpdating(false);
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'You need to allow access to your media library.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setImageLoading(true);
      try {
        const fileName = `${studentEmail}.jpg`;
        const response = await fetch(uri);
        const blob = await response.blob();

        const params = {
          Bucket: s3BucketName,
          Key: `students/${fileName}`,
          Body: blob,
          ContentType: 'image/jpeg',
        };

        s3.upload(params, (err, data) => {
          if (err) {
            console.error('Error uploading image:', err);
            Alert.alert('Error', 'Failed to upload image.');
            setImageLoading(false);
            return;
          }
          setStudentProfile(data.Location);
          setImageLoading(false);
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload image.');
        setImageLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchClassesAndSubjects = async () => {
      try {
        const docRef = doc(firestore, 'BasicData', 'Data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClasses(data.Class?.map((cls) => ({ label: cls, value: cls })) || []);
          setSubjects(data.Subjects?.map((subj) => ({ label: subj, value: subj })) || []);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load classes or subjects.');
        console.error('Error fetching data:', error);
      }
    };
    fetchClassesAndSubjects();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Edit Student</Text>
          </TouchableOpacity>

        </View>

        <View style={styles.profileSection}>
          {imageLoading ? (
            <ActivityIndicator size="large" color={Colors.PRIMARY} />
          ) : (
            <Image style={styles.profileImage} source={studentProfile ? { uri: studentProfile } : dp} />
          )}
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            <Text style={styles.imageButtonText}>Change Image</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <TextInput
            label="Student Name"
            value={studentName}
            onChangeText={setStudentName}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            mode="outlined"
            style={styles.input}
            left={
              <TextInput.Icon
                icon="account-outline"
                size={24}
                style={styles.iconStyle}
              />
            }
            right={
              studentName.length > 0 && (
                <TextInput.Icon
                  icon="close-circle"
                  size={24}
                  style={styles.iconStyle}
                  onPress={() => setStudentName('')}
                />
              )
            }
          />
          <TextInput
            label="Student Email"
            value={studentEmail}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            onChangeText={setStudentEmail}
            mode="outlined"
            style={styles.input}
            left={
              <TextInput.Icon
                icon="email-outline"
                size={24}
                style={styles.iconStyle}
              />
            }
            right={
              studentEmail.length > 0 && (
                <TextInput.Icon
                  icon="close-circle"
                  size={24}
                  style={styles.iconStyle}
                  onPress={() => setStudentEmail('')}
                />
              )
            }
          />
          <TextInput
            label="Roll No"
            value={studentRollNo}
            onChangeText={setStudentRollNo}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            mode="outlined"
            style={styles.input}
            left={
              <TextInput.Icon
                icon="numeric"
                size={24}
                style={styles.iconStyle}
              />
            }
            right={
              studentRollNo.length > 0 && (
                <TextInput.Icon
                  icon="close-circle"
                  size={24}
                  style={styles.iconStyle}
                  onPress={() => setStudentRollNo('')}
                />
              )
            }
          />
          <View style={[styles.dropdownContainer]}>
            <MaterialIcons
              name="domain"
              size={24}
              color={Colors.PRIMARY}
              style={styles.iconStyle}
            />
            <Dropdown
              style={styles.dropdown}
              data={classes}
              labelField="label"
              valueField="value"
              search
              searchPlaceholder='Search Classes'
              placeholder="Select Class"
              value={studentClass}
              onChange={(item) => setStudentClass(item.value)}
            />
          </View>
          <View style={[styles.dropdownContainer]}>
            <MaterialIcons
              name="domain"
              size={24}
              color={Colors.PRIMARY}
              style={styles.iconStyle}
            />
            <Dropdown
              style={styles.dropdown}
              data={subjects}
              labelField="label"
              valueField="value"
              search
              searchPlaceholder='Search Subjects'
              placeholder="Select Subjects"
              onChange={(item) => {
                if (!subjectsSelected.includes(item.value)) {
                  setSubjectsSelected([...subjectsSelected, item.value]);
                }
                else {
                  alert(`${item.value} already selected`)

                }
              }}
            />
          </View>
          <View style={styles.classesSection}>
            <Text style={styles.classTitle}>Enrolled Subjects</Text>
            <View style={styles.chipContainer}>
              {subjectsSelected.length > 0 ? (
                subjectsSelected.map((chip) => (
                  <View key={chip} style={styles.chipWrapper}>
                    <TouchableOpacity
                      style={styles.chip}
                      onPress={() => {
                        Alert.alert("Alert", `Do you want to remove ${chip}`, [
                          {
                            text: "Yes",
                            onPress: () => {
                              setSubjectsSelected((prev) =>
                                prev.includes(chip) ? prev.filter((subject) => subject !== chip) : [...prev, chip]
                              );
                            }
                          },
                          {
                            text: "No",
                          }
                        ])
                      }}
                    >
                      <Text style={styles.chipText}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noChipsText}>No Classes Available</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.updateButton, isUpdating && { opacity: 0.7 }]}
          onPress={handleUpdate}
          onLongPress={handleDelete}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.updateButtonText}>Update Student</Text>
          )}
        </TouchableOpacity>


      </ScrollView>
    </SafeAreaView>
  );
};

export default StudentProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    fontWeight:'bold',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    color: Colors.PRIMARY,
    fontWeight:'bold',
    fontSize: 16,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginLeft: 16,
  },

  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 5,
  },
  imageButtonText: {
    color: 'white',
    fontSize: 16,
  },
  formSection: {
    marginHorizontal: 15,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderColor: Colors.PRIMARY,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10, // Adjusted for better spacing
    marginBottom: 15,
    backgroundColor: 'white',
  },
  iconStyle: {
    marginRight: 10, // Space between icon and dropdown
  },
  dropdown: {
    flex: 1, // Ensures dropdown takes remaining space
    height: '100%', // Matches the container height
    paddingHorizontal: 8,
    backgroundColor: 'white',
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: Colors.SECONDARY,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    fontSize: 18,
    color: 'white',
  },
  classesSection: {
    marginBottom: 20,
  },
  classTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#153448',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipWrapper: {
    marginBottom: 10,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
  },
  chip: {
    backgroundColor: '#e9ecef',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderColor: Colors.SECONDARY,
    borderWidth: 0.5,
    borderRadius: 20,
  },
  selectedChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: Colors.SECONDARY,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: 'black',
  },
  selectedChipText: {
    color: 'white',
    fontSize: 14,
  },
  noChipsText: {
    color: '#6c757d',
    fontSize: 14,
    marginTop: 10,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
});
