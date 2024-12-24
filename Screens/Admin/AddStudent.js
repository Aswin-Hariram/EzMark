import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';

const AddStudent = () => {
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentDepartment, setStudentDepartment] = useState(null);
    const [studentClass, setStudentClass] = useState(null);
    const [studentImage, setStudentImage] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState([]);

    const departments = [
        { id: '1', label: 'CSE' },
        { id: '2', label: 'IT' },
        { id: '3', label: 'ECE' },
        { id: '4', label: 'EEE' },
        { id: '5', label: 'Mech' },
    ];

    const classes = [
        { id: '1', label: 'CSE A' },
        { id: '2', label: 'IT A' },
    ];

    const subjects = [
        { id: '1', label: 'Mathematics' },
        { id: '2', label: 'Science' },
        { id: '3', label: 'History' },
    ];

    const navigation = useNavigation();

    const handleSaveStudent = () => {
        if (!studentName || !studentEmail || !studentDepartment || !studentClass) {
            alert('Please fill out all fields.');
            return;
        }

        const newStudent = {
            id: Date.now().toString(),
            Name: studentName,
            Email: studentEmail,
            Department: studentDepartment,
            Image: studentImage,
            Subjects: selectedSubjects,
            Class: studentClass,
        };

        console.log('New student added:', newStudent);
        navigation.goBack();
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setStudentImage(result.assets[0].uri);
        }
    };

    const toggleSubjectSelection = (id) => {
        setSelectedSubjects((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
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
                        outlineColor="#153448"
                        activeOutlineColor="#153448"
                        style={styles.inputField}
                    />

                    <TextInput
                        label="Student Email"
                        value={studentEmail}
                        onChangeText={setStudentEmail}
                        mode="outlined"
                        outlineColor="#153448"
                        activeOutlineColor="#153448"
                        keyboardType="email-address"
                        style={styles.inputField}
                    />

                    <View style={{ zIndex: isDropdownOpen ? 10 : 0 }}>
                        <DropDownPicker
                            open={isDropdownOpen}
                            value={studentDepartment} // Ensure this matches the selected value
                            items={departments.map((dept) => ({
                                label: dept.label, // Display text
                                value: dept.label, // Actual value stored
                                key: dept.id, // Unique key
                            }))}
                            setOpen={setIsDropdownOpen}
                            setValue={setStudentDepartment}
                            placeholder="Select Department"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                        />



                    </View>

                    <View style={{ zIndex: isClassDropdownOpen ? 9 : 0 }}>
                        <DropDownPicker
                            open={isClassDropdownOpen}
                            value={studentClass} // Ensure this matches the selected value
                            items={classes.map((cls) => ({
                                label: cls.label, // Display text
                                value: cls.label, // Actual value stored
                                key: cls.id, // Unique key
                            }))}
                            setOpen={setIsClassDropdownOpen}
                            setValue={setStudentClass}
                            placeholder="Select Class"
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownContainer}
                        />
                    </View>
                </View>

                <View style={styles.chipSection}>
                    <Text style={styles.classTitle}>Subjects Enrolled</Text>
                    <View style={styles.chipContainer}>
                        {subjects.map((subject) => (
                            <TouchableOpacity
                                key={subject.id}
                                style={
                                    selectedSubjects.includes(subject.id)
                                        ? styles.selectedChip
                                        : styles.chip
                                }
                                onPress={() => toggleSubjectSelection(subject.id)}
                            >
                                <Text
                                    style={
                                        selectedSubjects.includes(subject.id)
                                            ? styles.selectedChipText
                                            : styles.chipText
                                    }
                                >
                                    {subject.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveStudent}>
                    <Text style={styles.saveButtonText}>Save Student</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddStudent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 15 : 0,
    },
    scrollView: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Platform.OS === 'android' ? 5 : 4,
    },
    headerText: {
        marginLeft: 10,
        fontWeight: 'bold',
        fontSize: 18,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    studentImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    imagePlaceholder: {
        color: '#888',
        fontSize: 16,
    },
    formSection: {
        marginBottom: 20,
    },
    inputField: {
        backgroundColor: 'white',
        marginBottom: 15,
    },
    dropdown: {
        backgroundColor: 'white',
        borderColor: '#153448',
        marginBottom: 15,
    },
    dropdownContainer: {
        borderColor: '#153448',
        zIndex: 10, // Ensure dropdown is on top
    },
    chipSection: {
        marginVertical: 15,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#EEEEEE',
        borderRadius: 20,
        margin: 5,
    },
    selectedChip: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: Colors.PRIMARY,
        borderRadius: 20,
        margin: 5,
    },
    chipText: {
        fontSize: 14,
        color: 'black',
    },
    selectedChipText: {
        fontSize: 14,
        color: 'white',
    },
    saveButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    classTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
