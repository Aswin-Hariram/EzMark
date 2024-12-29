import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import dp from "../../assets/Teachers/profile.png";
import * as ImagePicker from 'expo-image-picker';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { Dropdown } from 'react-native-element-dropdown';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import AWS from 'aws-sdk';
import { Buffer } from 'buffer';
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
  const [studentProfile, setStudentProfile] = useState(student.image);
  const [imageLoading, setImageLoading] = useState(false);

 
  const s3BucketName = 'ezmarkbucket'; // Replace with your S3 bucket name

  const deleteFromFirestore = () => {
    setIsUpdating(true);
    deleteDoc(doc(firestore, "UserData", student.id))
      .then(() => {
        alert("Student deleted successfully");
      })
      .catch((error) => {
        alert("Error", error.message);
      })
      .finally(() => {
        setIsUpdating(false);
        getStudent();
        navigation.goBack();
      });
  };

  const handleDelete = () => {
    Alert.alert("Alert", "Do you want to delete student, Are you sure?", [
      {
        text: "Yes",
        onPress: () => { deleteFromFirestore() }
      },
      {
        text: "No",
        onPress: () => { }
      }
    ]);
  };

  const updateStudentInFirestore = async (updatedStudent) => {
    try {
      const studentRef = doc(firestore, 'UserData', student.id);
      await updateDoc(studentRef, updatedStudent);
      Alert.alert('Success', 'Student details updated successfully.');
    } catch (error) {
      console.error('Error updating student in Firestore:', error);
      Alert.alert('Error', 'Failed to update student details.');
    } finally {
      getStudent();
      navigation.goBack();
    }
  };

  const validateInput = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zAZ]{2,6}$/;

    if (!studentName || !studentEmail || !studentDepartment || !studentClass || !studentRollNo) {
      Alert.alert('Error', 'Please fill out all fields.');
      return false;
    }

    if (!emailRegex.test(studentEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
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
      image: studentProfile, // Update the image URL
    };

    try {
      await updateStudentInFirestore(updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'You need to allow access to your media library.');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setImageLoading(true);
      try {
        const fileName = `${studentEmail}.jpg`; // Save with email as filename
        const response = await fetch(uri);
        const blob = await response.blob();

        const params = {
          Bucket: s3BucketName,
          Key: `students/${fileName}`, // Store the image under the 'students' folder
          Body: blob,
          ContentType: 'image/jpeg', 
        };

        // Upload the file to S3
        s3.upload(params, (err, data) => {
          if (err) {
            console.error('Error uploading image to S3:', err);
            Alert.alert('Error', 'Failed to upload image.');
            setImageLoading(false);
            return;
          }

          // Get the URL of the uploaded file and update studentProfile
          const fileUrl = data.Location;
          setStudentProfile(fileUrl); // Set new profile URL
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
    const fetchClasses = async () => {
      try {
        const docRef = doc(firestore, 'BasicData', 'Data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.Class) {
            setClasses(data.Class.map((cls) => ({ label: cls, value: cls })));
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
        Alert.alert('Error', 'Failed to load classes.');
      }
    };
    fetchClasses();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Student</Text>
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
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Student Email"
            value={studentEmail}
            onChangeText={setStudentEmail}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Roll No"
            value={studentRollNo}
            onChangeText={setStudentRollNo}
            mode="outlined"
            style={styles.input}
          />

          <Dropdown
            style={styles.dropdown}
            data={classes}
            labelField="label"
            valueField="value"
            placeholder="Select Class"
            value={studentClass}
            onChange={(item) => setStudentClass(item.value)}
          />
        </View>

        <TouchableOpacity
          style={[styles.updateButton, isUpdating && { opacity: 0.7 }]}
          onPress={handleUpdate}
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 18,
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
  dropdown: {
    height: 50,
    borderColor: '#153448',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  updateButton: {
    backgroundColor: Colors.PRIMARY,
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
});
