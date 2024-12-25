import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TextInput } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import PasswordTextInput from '../../Components/PasswordTextInput';

const AddTeacher = () => {
    const [teacherName, setTeacherName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const [teacherDepartment, setTeacherDepartment] = useState(null);
    const [teacherPassword, setTeacherPassword] = useState('');
    const [teacherImage, setTeacherImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([
        { label: 'Computer Science', value: 'Computer Science' },
        { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
        { label: 'Civil Engineering', value: 'Civil Engineering' },
        { label: 'Electrical Engineering', value: 'Electrical Engineering' },
        { label: 'Electronics & Communication', value: 'Electronics & Communication' },
        { label: 'Information Technology', value: 'Information Technology' },
        { label: 'Chemical Engineering', value: 'Chemical Engineering' },
        { label: 'Biotechnology', value: 'Biotechnology' },
    ]);
    const [classes, setClasses] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchBasicData = async () => {
            try {
                const docRef = doc(firestore, 'BasicData', 'Data');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.Class) {
                        const formattedClasses = data.Class.map((cls, index) => ({
                            id: index + 1,
                            label: cls,
                        }));
                        setClasses(formattedClasses);
                    }
                }
            } catch (error) {
                console.error('Error fetching basic data:', error);
                Alert.alert('Error', 'Failed to load classes.');
            }
        };
        fetchBasicData();
    }, []);

    const handleSaveTeacher = async () => {
        if (!teacherName || !teacherEmail || !teacherDepartment) {
            return Alert.alert('Missing Fields', 'Please fill out all fields.');
        }
        setLoading(true);

        const selectedSubjectLabels = selectedSubjects.map((id) => {
            const subject = subjects.find((subject) => subject.id === id);
            return subject ? subject.label : null;
        }).filter(Boolean);

        const selectedClassLabels = selectedClasses.map((id) => {
            const cls = classes.find((cls) => cls.id === id);
            return cls ? cls.label : null;
        }).filter(Boolean);

        const newTeacher = {
            id: Date.now().toString(),
            name: teacherName,
            email: teacherEmail.toLowerCase(),
            department: teacherDepartment,
            image: teacherImage,
            subjects: selectedSubjectLabels,
            classes: selectedClassLabels,
            type: 'Teacher',
            password: teacherPassword || 'Test123',
        };

        try {
            await setDoc(doc(firestore, 'UserData', teacherEmail.toLowerCase()), newTeacher);
            await createUserWithEmailAndPassword(auth, teacherEmail, teacherPassword || 'defaultPassword123');
            Alert.alert('Success', 'Teacher added successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error saving teacher data:', error);
            Alert.alert('Error', 'Failed to save teacher data.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            setTeacherImage(result.assets[0].uri);
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

                <View style={styles.imageSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                        {teacherImage ? (
                            <Image source={{ uri: teacherImage }} style={styles.teacherImage} />
                        ) : (
                            <Text style={styles.imagePlaceholder}>Upload Image</Text>
                        )}
                    </TouchableOpacity>
                </View>

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
                    <PasswordTextInput
                        value={teacherPassword}
                        onChangeText={setTeacherPassword}
                        placeholder="Enter your password"
                        lockIconSource={require('../../assets/Login/lock.png')}
                        style={styles.input}
                    />
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={departments}
                        labelField="label"
                        valueField="value"
                        onChange={(item) => setTeacherDepartment(item.value)}
                    />
                </View>

                <View style={styles.chipSection}>
                    <Text style={styles.classTitle}>Classes Enrolled</Text>
                    <View style={styles.chipContainer}>
                        {classes.map((cls) => (
                            <TouchableOpacity
                                key={cls.id}
                                style={selectedClasses.includes(cls.id) ? styles.selectedChip : styles.chip}
                                onPress={() => setSelectedClasses((prev) =>
                                    prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                                )}
                            >
                                <Text style={selectedClasses.includes(cls.id) ? styles.selectedChipText : styles.chipText}>
                                    {cls.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveTeacher} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Teacher</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

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
    teacherImage: {
        width: '100%',
        height: '100%',
        borderRadius: 60,
    },
    placeholderStyle: {
        fontSize: 16,
        color: 'gray',
    },
    formSection: {
        marginBottom: 20,
    },
    inputField: {
        backgroundColor: 'white',
        marginBottom: 15,
    },
    dropdown: {
        height: 50,
        borderColor: Colors.PRIMARY,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginVertical: 10,
    },
    chipSection: {
        marginVertical: 15,
    },
    classTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
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
});

export default AddTeacher;
