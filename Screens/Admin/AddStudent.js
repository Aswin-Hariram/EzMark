import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import PasswordTextInput from '../../Components/PasswordTextInput';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { firestore, auth } from '../../Config/FirebaseConfig';

const AddStudent = () => {
    const navigation = useNavigation();
    const { getStudents } = useRoute().params;
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentRollno, setStudentRollno] = useState('');
    const [studentDepartment, setStudentDepartment] = useState(null);
    const [studentPassword, setStudentPassword] = useState('');
    const [studentClass, setStudentClass] = useState(null);
    const [studentImage, setStudentImage] = useState(null);
    const [classes, setClasses] = useState([]);
    const [processing, setProcessing] = useState(false);

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
        const fetchBasicData = async () => {
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
        fetchBasicData();
    }, []);

    const validateInput = () => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
         // Example regex for roll number (6-12 characters)

        // Check if any field is empty
        if (!studentName || !studentEmail || !studentDepartment || !studentClass || !studentRollno) {
            Alert.alert('Error', 'Please fill out all fields.');
            return false;
        }

        // Validate email
        if (!emailRegex.test(studentEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }

        // Validate roll number
        

        // Validate password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;
        if (!passwordRegex.test(studentPassword)) {
            Alert.alert(
                'Invalid Password',
                'Password must contain at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number.'
            );
            return false;
        }

        return true;
    };

    const checkIfRollnoExists = async () => {
        const q = query(collection(firestore, 'UserData'), where("rollno", "==", studentRollno));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const saveToFirestore = async (newStudent) => {
        try {
            await setDoc(doc(firestore, 'UserData', newStudent.id), newStudent);
            await createUserWithEmailAndPassword(auth, studentEmail, studentPassword);
            Alert.alert('Success', 'Student added successfully!');
        } catch (error) {
            console.error('Error saving student:', error.message);
            Alert.alert('Error', 'Failed to add student.');
        } finally {
            setProcessing(false);
            getStudents();
            navigation.goBack();
        }
    };

    const handleSaveStudent = async () => {
        if (validateInput()) {
            setProcessing(true);

            const rollnoExists = await checkIfRollnoExists();
            if (rollnoExists) {
                setProcessing(false);
                Alert.alert('Error', 'This roll number is already taken.');
                return;
            }

            const newStudent = {
                id: Date.now().toString(),
                name: studentName,
                email: studentEmail.toLowerCase(),
                department: studentDepartment,
                image: studentImage,
                class: studentClass,
                rollno: studentRollno,
                password: studentPassword,
                type: "Student"
            };

            saveToFirestore(newStudent);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets) {
            setStudentImage(result.assets[0].uri);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Add Student</Text>
                </View>

                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {studentImage ? (
                            <Image source={{ uri: studentImage }} style={styles.studentImage} />
                        ) : (
                            <Text style={styles.imagePlaceholder}>Upload Image</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.formSection}>
                    <TextInput
                        label="Student Name"
                        value={studentName}
                        onChangeText={setStudentName}
                        mode="outlined"
                        activeOutlineColor={Colors.PRIMARY}
                        outlineColor={Colors.SECONDARY}
                        style={styles.inputField}
                    />
                    <TextInput
                        label="Student Email"
                        value={studentEmail}
                        onChangeText={setStudentEmail}
                        mode="outlined"
                        activeOutlineColor={Colors.PRIMARY}
                        outlineColor={Colors.SECONDARY}
                        keyboardType="email-address"
                        style={styles.inputField}
                    />
                    <TextInput
                        label="Roll Number"
                        value={studentRollno}
                        onChangeText={setStudentRollno}
                        mode="outlined"
                        activeOutlineColor={Colors.PRIMARY}
                        outlineColor={Colors.SECONDARY}
                        style={styles.inputField}
                    />
                    <Dropdown
                        style={styles.dropdown}
                        data={departmentDropdownData}
                        labelField="label"
                        valueField="value"
                        activeColor={Colors.PRIMARY}
                        placeholder="Select Department"
                        value={studentDepartment}
                        onChange={(item) => setStudentDepartment(item.value)}
                    />
                    <Dropdown
                        style={styles.dropdown}
                        data={classes}
                        labelField="label"
                        valueField="value"
                        search
                        placeholder="Select Class"
                        value={studentClass}
                        onChange={(item) => setStudentClass(item.value)}
                    />
                    <PasswordTextInput
                        value={studentPassword}
                        onChangeText={setStudentPassword}
                        placeholder="Enter Password"
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveStudent} disabled={processing}>
                    {processing ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Student</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddStudent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 20 : 0,
    },
    scrollView: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        marginLeft: 10,
        fontWeight: 'bold',
        fontSize: 20,
        color: '#153448',
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    studentImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    imagePlaceholder: {
        color: '#6c757d',
        fontSize: 16,
    },
    formSection: {
        marginBottom: 20,
    },
    inputField: {
        backgroundColor: 'white',
        borderColor:Colors.PRIMARY,
        marginBottom: 15,
        borderRadius: 10,
    },
    dropdown: {
        height: 50,
        borderColor: Colors.PRIMARY,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 15,
        backgroundColor: 'white',
    },
    saveButton: {
        backgroundColor: '#153448',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
