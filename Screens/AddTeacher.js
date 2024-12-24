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
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../assets/Colors';

const AddTeacher = () => {
    const [teacherName, setTeacherName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const [teacherDepartment, setTeacherDepartment] = useState(null);
    const [selectedChip, setSelectedChip] = useState(null);
    const [edit, setEdit] = useState(false);
    const [teacherImage, setTeacherImage] = useState(null);
    const [departments, setDepartments] = useState([

        { label: 'Mathematics', value: 'Mathematics' },
        { label: 'Science', value: 'Science' },
        { label: 'History', value: 'History' },
    ]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [subjects, setSubjects] = useState([
        { id: 1, label: 'Mathematics' },
        { id: 2, label: 'Science' },
        { id: 3, label: 'History' },
    ]);
    const [classes, setClasses] = useState([
        { id: 1, label: 'Class A' },
        { id: 2, label: 'Class B' },
        { id: 3, label: 'Class C' },
    ]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const navigation = useNavigation();

    const handleSaveTeacher = () => {
        if (!teacherName || !teacherEmail || !teacherDepartment) {
            alert('Please fill out all fields.');
            return;
        }

        const newTeacher = {
            id: Date.now().toString(),
            Name: teacherName,
            Email: teacherEmail,
            Department: teacherDepartment,
            Image: teacherImage,
            Subjects: selectedSubjects,
            Classes: selectedClasses,
        };

        console.log('New teacher added:', newTeacher);
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
            setTeacherImage(result.assets[0].uri);
        }
    };

    const toggleSelection = (id, isSubject) => {
        if (isSubject) {
            setSelectedSubjects((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        } else {
            setSelectedClasses((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Add Teacher</Text>
                </View>

                {/* Image Upload */}
                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {teacherImage ? (
                            <Image source={{ uri: teacherImage }} style={styles.teacherImage} />
                        ) : (
                            <Text style={styles.imagePlaceholder}>Upload Image</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Input Fields */}
                <View style={styles.formSection}>
                    <TextInput
                        label="Teacher Name"
                        value={teacherName}
                        onChangeText={setTeacherName}
                        mode="outlined"
                        outlineColor="#153448"
                        activeOutlineColor="#153448"
                        style={styles.inputField}
                    />

                    <TextInput
                        label="Teacher Email"
                        value={teacherEmail}
                        onChangeText={setTeacherEmail}
                        mode="outlined"
                        outlineColor="#153448"
                        activeOutlineColor="#153448"
                        keyboardType="email-address"
                        style={styles.inputField}
                    />

                    <DropDownPicker
                        open={isDropdownOpen}
                        value={teacherDepartment}
                        items={departments}
                        setOpen={setIsDropdownOpen}
                        setValue={setTeacherDepartment}
                        setItems={setDepartments}
                        placeholder="Select Department"
                        style={styles.dropdown}
                        dropDownContainerStyle={styles.dropdownContainer}
                    />
                </View>

                {/* Subjects Section */}
                <View style={styles.chipSection}>
                    <View style={styles.classesHeader}>
                        <Text style={styles.classTitle}>Subjects Enrolled</Text>
                        <TouchableOpacity onPress={() => setEdit(!edit)}>
                            <View style={styles.editChip}>
                                <Text style={styles.editChipText}>Add</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.chipContainer}>
                        {subjects.map((subject) => (
                            <TouchableOpacity
                                key={subject.id}
                                style={
                                    selectedSubjects.includes(subject.id)
                                        ? styles.selectedChip
                                        : styles.chip
                                }
                                onPress={() => toggleSelection(subject.id, true)}
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

                {/* Classes Section */}
                <View style={styles.chipSection}>
                <View style={styles.classesHeader}>
                        <Text style={styles.classTitle}>Classes Enrolled</Text>
                        <TouchableOpacity onPress={() => setEdit(!edit)}>
                            <View style={styles.editChip}>
                                <Text style={styles.editChipText}>Add</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.chipContainer}>
                        {classes.map((cls) => (
                            <TouchableOpacity
                                key={cls.id}
                                style={
                                    selectedClasses.includes(cls.id)
                                        ? styles.selectedChip
                                        : styles.chip
                                }
                                onPress={() => toggleSelection(cls.id, false)}
                            >
                                <Text
                                    style={
                                        selectedClasses.includes(cls.id)
                                            ? styles.selectedChipText
                                            : styles.chipText
                                    }
                                >
                                    {cls.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveTeacher}>
                    <Text style={styles.saveButtonText}>Save Teacher</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddTeacher;

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
        marginVertical: Platform.OS === 'android' ? 5 :4,
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
    teacherImage: {
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
    },
    chipSection: {
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
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
    classesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    classTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    editChip: {
       
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        
    },
    editChipText: {
        fontSize: 14,
        color: Colors.PRIMARY,
        fontFamily:'Signika',
        fontWeight:'semibold',

    },
});

