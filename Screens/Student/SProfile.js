import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import dp from "../../assets/Teachers/profile.png";
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { Dropdown } from 'react-native-element-dropdown';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import LottieView from 'lottie-react-native';

const SProfile = ({ student }) => {
  const navigation = useNavigation();

  const [studentName, setStudentName] = useState(student?.name || '');
  const [studentEmail, setStudentEmail] = useState(student?.email || '');
  const [studentDepartment, setStudentDepartment] = useState(student?.department || '');
  const [studentRollNo, setStudentRollNo] = useState(student?.rollno || '');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([])
  const [subjectsSelected, setSubjectsSelected] = useState(student?.subjects || []);
  const [studentClass, setStudentClass] = useState(student?.class || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [studentImage, setStudentImage] = useState(student?.image || dp);
  const [loading, setLoading] = useState(true);


  // useEffect(() => {
  //   const fetchClasses = async () => {
  //     try {
  //       const docRef = doc(firestore, 'BasicData', 'Data');
  //       const docSnap = await getDoc(docRef);
  //       if (docSnap.exists()) {
  //         const data = docSnap.data();
  //         if (data.Class) {
  //           setClasses(data.Class.map((cls) => ({ label: cls, value: cls })));
  //         }
  //       } else {
  //         console.warn("No classes data found");
  //       }
  //     } catch (error) {
  //       console.error('Error fetching classes:', error);
  //       Alert.alert('Error', 'Failed to load classes.');
  //     }
  //   };
  //   fetchClasses();
  // }, []);

  // const validateInput = () => {
  //   const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  //   if (!studentName || !studentEmail || !studentDepartment || !studentClass || !studentRollNo) {
  //     Alert.alert('Error', 'Please fill out all fields.');
  //     return false;
  //   }
  //   if (!emailRegex.test(studentEmail)) {
  //     Alert.alert('Invalid Email', 'Please enter a valid email address.');
  //     return false;
  //   }
  //   return true;
  // };

  // const handleUpdate = async () => {
  //   if (!validateInput() || !student?.id) return;

  //   setIsUpdating(true);
  //   const updatedStudent = {
  //     name: studentName,
  //     email: studentEmail,
  //     department: studentDepartment,
  //     rollno: studentRollNo,
  //     class: studentClass,
  //   };

  //   try {
  //     const studentRef = doc(firestore, 'UserData', student.id);
  //     await updateDoc(studentRef, updatedStudent);
  //     Alert.alert('Success', 'Student details updated successfully.');
  //     navigation.goBack();
  //   } catch (error) {
  //     console.error('Error updating student:', error);
  //     Alert.alert('Error', 'Failed to update student details.');
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  // const handleDelete = () => {
  //   if (!student?.id) return;
  //   Alert.alert("Alert", "Do you want to delete student? Are you sure?", [
  //     {
  //       text: "Yes",
  //       onPress: async () => {
  //         setIsUpdating(true);
  //         try {
  //           await deleteDoc(doc(firestore, "UserData", student.id));
  //           Alert.alert("Success", "Student deleted successfully");
  //           navigation.goBack();
  //         } catch (error) {
  //           console.error('Error deleting student:', error);
  //           Alert.alert("Error", "Failed to delete student.");
  //         } finally {
  //           setIsUpdating(false);
  //         }
  //       },
  //     },
  //     {
  //       text: "No",
  //     },
  //   ]);
  // };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <ScrollView>


        <View style={styles.profileSection}>
        
          {loading && (
            <View style={styles.Lcontainer}>
              <View style={styles.wrapper}>
                <LottieView
                  source={require('../../assets/avatar.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              </View>
            </View>
          )}
          <Image
            style={!loading ? styles.profileImage : { width: 0, height: 0 }}
            source={{ uri: studentImage }}
            onLoadEnd={() => setLoading(false)}
            onError={() => setLoading(false)} // Fallback in case the image fails to load
          />
        </View>

        <View style={styles.formSection}>
        <Text style={styles.classTitle}>Personal Details</Text>
          <TextInput
            label="Name"
            value={studentName}
            onChangeText={setStudentName}
            mode="outlined"
            style={styles.input}
            editable={false}
            left={
              <TextInput.Icon
                icon="account-outline"
                size={24}
                style={styles.iconStyle}
              />
            }
          />
          <TextInput
            label="Email"
            value={studentEmail}
            onChangeText={setStudentEmail}
            mode="outlined"
            style={styles.input}
            editable={false}
            left={
              <TextInput.Icon
                icon="email-outline"
                size={24}
                style={styles.iconStyle}
              />
            }
          />
          <TextInput
            label="Roll No"
            value={studentRollNo}
            onChangeText={setStudentRollNo}
            mode="outlined"
            style={styles.input}
            editable={false}
            left={
              <TextInput.Icon
                icon="numeric"
                size={24}
                style={styles.iconStyle}
              />
            }
          />
          <TextInput
            label="Department"
            value={studentDepartment}
            onChangeText={setStudentRollNo}
            mode="outlined"
            style={styles.input}
            editable={false}
            left={
              <TextInput.Icon
                icon="domain"
                size={24}
                style={styles.iconStyle}
              />
            }
          />
          <TextInput
            label="Class"
            value={studentClass}
            onChangeText={setStudentRollNo}
            mode="outlined"
            style={styles.input}
            editable={false}
            left={
              <TextInput.Icon
                icon="domain"
                size={24}
                style={styles.iconStyle}
              />
            }
          />
          {/* <Dropdown
            style={styles.dropdown}
            data={classes}
            labelField="label"
            valueField="value"
            placeholder="Select Class"
            value={studentClass}
            disable={true}
          /> */}

          {/* <Dropdown
            style={styles.dropdown}
            data={subjects}
            labelField="label"
            valueField="value"
            search
            placeholder="Select Subjects"
            onChange={(item) => setSubjectsSelected([...subjectsSelected, item.value])}
          /> */}
          <View style={styles.classesSection}>
            <Text style={styles.classTitle}>Enrolled Subjects</Text>
            <View style={styles.chipContainer}>
              {subjectsSelected.length > 0 ? (
                subjectsSelected.map((chip) => (
                  <View key={chip} style={styles.chipWrapper}>
                    <TouchableOpacity

                      style={styles.chip}
                    // onPress={() => {
                    //   Alert.alert("Alert", `Do you want to remove ${chip}`, [
                    //     {
                    //       text: "Yes",
                    //       onPress: () => {
                    //         setSubjectsSelected((prev) =>
                    //           prev.includes(chip) ? prev.filter((subject) => subject !== chip) : [...prev, chip]
                    //         );
                    //       }
                    //     },
                    //     {
                    //       text: "No",
                    //     }
                    //   ])
                    // }}
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
          onPress={() => {
            Alert.alert("Logout", "Are you sure you want to logout?", [
              {
                text: "No",
                onPress: () => console.log("Cancel Pressed"),
              }, {
                text: "Yes",
                onPress: () => {
                  auth.signOut()
                    .then(() => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      })
                    });
                }
              }
            ], { cancelable: true });

          }}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.updateButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SProfile;

const styles = StyleSheet.create({
  Lcontainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    width: 250, // Set desired dimensions
    height: 170,
    overflow: 'hidden', // Ensures content doesn't spill out
  },
  lottie: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'center', // Centers the animation in its container
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    paddingTop: Platform.OS === 'ios' ? 0 : 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    marginLeft: 8,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  formSection: {
    marginHorizontal: 5,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 15,
  },
  iconStyle: {
    marginRight: 10, // Space between icon and dropdown
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
    backgroundColor: Colors.SECONDARY,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  updateButtonText: {
    fontSize: 18,
    color: 'white',
  },
  classesSection: {
    marginBottom: 15,
  },
  classTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#153448',
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Ensures chips wrap to the next line only when necessary
    justifyContent: 'flex-start', // Aligns chips at the start
    alignItems: 'center', // Aligns chips vertically
  },

  chipWrapper: {
    marginBottom: 10,
    marginRight: 3,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',// Prevents individual chips from shrinking
  },
  chipText: {
    fontSize: 14,
    color: 'black',
    textAlign: 'center', // Ensures text alignment is consistent
  },
  selectedChipText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#EEEEEE',
    borderColor: Colors.SECONDARY,
    borderWidth: 0.5,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: 'black',
  },
  noChipsText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
});
