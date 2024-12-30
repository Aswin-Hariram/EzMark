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
import { Buffer } from 'buffer';
import { s3 } from '../../Config/awsConfig';

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
    const [subjects, setSubjects] = useState([])
    const [subjectsSelected, setSubjectsSelected] = useState([])
    const [processing, setProcessing] = useState(false);
    const [imgUrl, setImageUrl] = useState('');

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
                    if (data.Subjects) {
                        setSubjects(data.Subjects.map((Subject) => ({ label: Subject, value: Subject })));
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

        if (!studentName || !studentEmail || !studentDepartment || !studentClass || !studentRollno) {
            Alert.alert('Error', 'Please fill out all fields.');
            return false;
        }

        if (!emailRegex.test(studentEmail)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }

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
        const q = query(collection(firestore, 'UserData'), where('rollno', '==', studentRollno));
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

    const uploadImageToS3 = async (uri) => {
        try {
            const fileName = uri.split('/').pop();
            const fileType = fileName.split('.').pop();

            const file = {
                uri,
                name: studentEmail,
                type: `image/${fileType}`,
            };

            const buffer = await fetch(file.uri).then((res) => res.arrayBuffer());
            const bufferData = Buffer.from(buffer);

            const params = {
                Bucket: 'ezmarkbucket',
                Key: `students/${fileName}`,
                Body: bufferData,
                ContentType: file.type,
            };

            const data = await s3.upload(params).promise();
            const imageUrl = data.Location;
            setImageUrl(imageUrl);
            return imageUrl;
        } catch (error) {
            console.error('Error uploading image:', error.message);
            Alert.alert('Error', 'Failed to upload image.');
            return null;
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                setStudentImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error.message);
            Alert.alert('Error', 'Failed to pick an image.');
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

            const imageUrl = await uploadImageToS3(studentImage);
            if (!imageUrl) {
                setProcessing(false);
                return;
            }

            const newStudent = {
                id: Date.now().toString(),
                name: studentName,
                email: studentEmail.toLowerCase(),
                department: studentDepartment,
                image: imageUrl,
                class: studentClass,
                rollno: studentRollno,
                password: studentPassword,
                type: 'Student',
                subjects:subjectsSelected
            };

            saveToFirestore(newStudent);
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
                    <View style={{ marginBottom: 15 }}>
                        <PasswordTextInput
                            value={studentPassword}
                            onChangeText={setStudentPassword}
                            placeholder="Enter Password"
                        />
                    </View>
                    <Dropdown
                        style={styles.dropdown}
                        data={subjects}
                        labelField="label"
                        valueField="value"
                        search
                        placeholder="Select Subjects"
                        onChange={(item) => setSubjectsSelected([...subjectsSelected, item.value])}
                    />
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
                                                        text:"No",
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
                    style={styles.saveButton}
                    onPress={handleSaveStudent}
                    disabled={processing}
                >
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
        fontSize: 22,
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
        textAlign: 'center',
    },
    formSection: {
        marginBottom: 20,
    },
    inputField: {
        backgroundColor: 'white',
        borderColor: Colors.PRIMARY,
        marginBottom: 15,
        borderRadius: 10,
        fontSize: 16,
        paddingLeft: 10,
    },
    dropdown: {
        height: 50,
        borderColor: Colors.PRIMARY,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 15,
        backgroundColor: 'white',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#153448',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
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
    },
    chip: {
        backgroundColor: '#e9ecef',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    selectedChip: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    chipText: {
        color: '#6c757d',
        fontSize: 14,
    },
    selectedChipText: {
        color: 'white',
        fontSize: 14,
    },
    noChipsText: {
        color: '#6c757d',
        fontSize: 14,
        marginTop: 10,
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
});

