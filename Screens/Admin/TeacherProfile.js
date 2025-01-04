import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Dropdown } from 'react-native-element-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import dp from "../../assets/Teachers/profile.png";
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { getFunctions, httpsCallable } from "firebase/functions";
import LottieView from 'lottie-react-native';

const TeacherProfile = ({ teacher1, getTeachers1 }) => {
  const route = useRoute();
  const { teacher = teacher1, getTeachers = getTeachers1 } = route.params || {};
  const navigation = useNavigation();
  const [selectedSubjects, setSelectedClasses] = useState([]);
  const [teacherName, setTeacherName] = useState(teacher.name);
  const [teacherEmail, setTeacherEmail] = useState(teacher.email);
  const [value, setValue] = useState(teacher.department);
  const [teacherPassword, setTeacherPassword] = useState(teacher.password);
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(false);

  const departmentDropdownData = [
    { label: 'Computer Science', value: 'Computer Science' },
    { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
    { label: 'Civil Engineering', value: 'Civil Engineering' },
    { label: 'Electrical Engineering', value: 'Electrical Engineering' },
    { label: 'Electronics & Communication', value: 'Electronics & Communication' },
    { label: 'Information Technology', value: 'Information Technology' },
    { label: 'Chemical Engineering', value: 'Chemical Engineering' },
    { label: 'Biotechnology', value: 'Biotechnology' },
  ];

  useEffect(() => {
    const fetchBasic = async () => {
      try {
        const docRef = doc(firestore, 'BasicData', 'Data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.Class) {
            setClassData(data.Class);
            setSelectedClasses(teacher.classes);
          }
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    };
    fetchBasic();
  }, []);

  const updateTeacherInFirestore = async (updatedTeacher) => {
    try {
      const teacherRef = doc(firestore, 'UserData', teacher.id); // Assuming email as unique identifier
      await updateDoc(teacherRef, updatedTeacher);

    } catch (error) {
      console.error('Error updating teacher in Firestore:', error);
      alert('Failed to update teacher details.');
    }
    finally {
      alert('Teacher details updated successfully.');
      getTeachers()
      navigation.goBack()
    }
  };

  const deleteFromFirestore = () => {
    setLoading(true);
    deleteDoc(doc(firestore, "UserData", teacher.id))
      .then(() => {
        alert("Teacher deleted successfully")
      })
      .catch((error) => {
        alert("Error", error.message)
      })
      .finally(() => {
        setLoading(false)
        getTeachers()
        navigation.goBack()
      })
  }
  const handleDelete = () => {
    Alert.alert("Alert", "Do you want to delete Teacher, Are you sure?", [
      {
        text: "Yes",
        onPress: () => { deleteFromFirestore() }
      },
      {
        text: "No",
        onPress: () => { }
      }
    ])
  }

  const updateTeacherPassword = async (email, newPassword) => {
    const functions = getFunctions();
    try {
      const updatePassword = httpsCallable(functions, "updateTeacherPassword");
      const result = await updatePassword({ email, newPassword });
      if (result.data.success) {
        updateTeacherInFirestore({
          name: teacherName,
          email: teacherEmail,
          password: teacherPassword,
          department: value,
          classes: selectedSubjects.length > 0 ? selectedSubjects : teacher.classes,
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Failed to update the password. " + error.message);
    }
  };

  const validateAndCreateUpdatedTeacher = async () => {
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherPassword.trim()) {
      alert('All fields are required. Please fill in the missing details.');
      return;
    }

    setLoading(true); // Start loading

    const updatedTeacher = {
      name: teacherName,
      email: teacherEmail,
      password: teacherPassword,
      department: value,
      classes: selectedSubjects.length > 0 ? selectedSubjects : teacher.classes,
    };

    try {
      if (teacher.password !== teacherPassword) {
        await updateTeacherPassword(teacherEmail, teacherPassword);
      } else {
        await updateTeacherInFirestore(updatedTeacher);
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher details. Please try again.');
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
        <TouchableOpacity style={styles.leftIcon} onPress={()=>{navigation.goBack()}}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Edit Profile</Text>
          </TouchableOpacity>
          <View style={styles.rightIcons}>
            <TouchableOpacity style={styles.icon}>
              <Ionicons name="ellipsis-vertical" size={22} color={Colors.PRIMARY} />
            </TouchableOpacity>
            
          </View>
        </View>

        <View style={styles.profileSection}>
          {/* <Image style={styles.profileImage} source={dp} /> */}
          <LottieView source={require("../../assets/avatar.json")} autoPlay loop style={styles.profileImage} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.classTitle}>Personal details</Text>
          <TextInput
            label="Teacher Name"
            value={teacherName}
            onChangeText={setTeacherName}
            mode="outlined"
            outlineColor={Colors.PRIMARY}
            activeOutlineColor={Colors.PRIMARY}
            style={styles.input}
          />

          <TextInput
            label="Teacher Email"
            value={teacherEmail}
            onChangeText={setTeacherEmail}
            mode="outlined"
            outlineColor={Colors.PRIMARY}
            activeOutlineColor={Colors.PRIMARY}
            style={styles.input}
          />

          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            inputSearchStyle={styles.inputSearchStyle}
            iconStyle={styles.iconStyle}
            data={departmentDropdownData}
            labelField="label"
            valueField="value"
            search
            maxHeight={300}
            value={value}
            onChange={(item) => setValue(item.value)}
          />
        </View>

        <View style={styles.classesSection}>
          <Text style={styles.classTitle}>Enrolled Classes</Text>
          <View style={styles.chipContainer}>
            {classData.length > 0 ? (
              classData.map((chip) => (
                <View key={chip} style={styles.chipWrapper}>
                  <TouchableOpacity
                    style={selectedSubjects.includes(chip) ? styles.selectedChip : styles.chip}
                    onPress={() => {
                      setSelectedClasses((prev) =>
                        prev.includes(chip) ? prev.filter((subject) => subject !== chip) : [...prev, chip]
                      );
                    }}
                  >
                    <Text style={selectedSubjects.includes(chip) ? styles.selectedChipText : styles.chipText}>
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

        <TouchableOpacity
          style={[styles.updateButton, loading && { opacity: 0.7 }]}
          onPress={validateAndCreateUpdatedTeacher}
          disabled={loading}
          onLongPress={handleDelete}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.updateButtonText}>Update Teacher</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS==='android'?10:0,
    paddingHorizontal:10
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginLeft: 16,
  },
  headerText: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 5,
  },
  profileImage: {
    width: 250,
    height: 150,
    borderRadius: 50,
    objectFit:'scale-down'
  },
  formSection: {
    marginVertical: 20,
  },
  input: {
    marginBottom: 10,
    backgroundColor: 'white',
  },
  classTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    borderColor: Colors.PRIMARY,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginVertical: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    color: 'gray',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  inputSearchStyle: {
    fontSize: 14,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
  },
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#EEEEEE',
    borderColor: Colors.SECONDARY,
    borderWidth: 0.5,
    borderRadius: 20,
  },
  selectedChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: Colors.SECONDARY,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: 'black',
  },
  selectedChipText: {
    fontSize: 14,
    color: 'white',
  },
  noChipsText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
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
