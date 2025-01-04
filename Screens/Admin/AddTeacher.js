import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform, Image, Alert,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TextInput } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import * as ImagePicker from 'expo-image-picker';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import PasswordTextInput from '../../Components/PasswordTextInput';
import { s3 } from '../../Config/awsConfig';
import { ActivityIndicator } from 'react-native-paper';

const AddTeacher = () => {
    const { getTeachers } = useRoute().params
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
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation();
    const [imgUrl, setImageUrl] = useState('');

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
                console.log('Error fetching basic data:', error);
                Alert.alert('Error', 'Failed to load classes.');
            }
        };
        fetchBasicData();
    }, []);

    const uploadImageToS3 = async (uri) => {
        try {
            const fileName = uri.split('/').pop();
            const fileType = fileName.split('.').pop();

            const file = {
                uri,
                name: teacherEmail,
                type: `image/${fileType}`,
            };

            const buffer = await fetch(file.uri).then((res) => res.arrayBuffer());
            const bufferData = Buffer.from(buffer);

            const params = {
                Bucket: 'ezmarkbucket',
                Key: `teachers/${fileName}`,
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

        const imageUrl = await uploadImageToS3(teacherImage);
        if (!imageUrl) {
            setProcessing(false);
            return;
        }
        const newTeacher = {
            id: Date.now().toString(),
            name: teacherName,
            email: teacherEmail.toLowerCase(),
            department: teacherDepartment,
            image: imageUrl,
            subjects: selectedSubjectLabels,
            classes: selectedClassLabels,
            type: 'Teacher',
            password: teacherPassword || 'Test123',
        };

        try {

            await createUserWithEmailAndPassword(auth, teacherEmail, teacherPassword || 'defaultPassword123');
            await setDoc(doc(firestore, 'UserData', newTeacher.id), newTeacher);
            Alert.alert('Success', 'Teacher added successfully!');

        } catch (error) {
            console.log('Error saving teacher data:', error);
            Alert.alert('Error', 'Failed to save teacher data.');
        } finally {
            setLoading(false);
            getTeachers()
            navigation.goBack();
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                setTeacherImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error.message);
            Alert.alert('Error', 'Failed to pick an image.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                        <Text style={styles.backText}>Add Teacher</Text>
                    </TouchableOpacity>

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
                        left={
                            <TextInput.Icon
                                icon="account-outline"
                                size={24}
                                style={styles.iconStyle}
                            />
                        }
                        right={
                            teacherName.length > 0 && (
                                <TextInput.Icon
                                    icon="close-circle"
                                    size={24}
                                    style={styles.iconStyle}
                                    onPress={() => setTeacherName('')}
                                />
                            )
                        }
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
                        left={
                            <TextInput.Icon
                                icon="email-outline"
                                size={24}
                                style={styles.iconStyle}
                            />
                        }
                        right={
                            teacherEmail.length > 0 && (
                                <TextInput.Icon
                                    icon="close-circle"
                                    size={24}
                                    style={styles.iconStyle}
                                    onPress={() => setTeacherEmail('')}
                                />
                            )
                        }
                    />


                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            label="Password"
                            secureTextEntry={!showPassword}
                            activeOutlineColor={Colors.PRIMARY}
                            mode="outlined"
                            contentStyle={styles.textInputContent}
                            activeUnderlineColor={Colors.PRIMARY}
                            value={teacherPassword}
                            onChangeText={setTeacherPassword}
                            right={
                                <TextInput.Icon
                                    icon="eye"
                                    size={24}
                                    style={styles.iconStyle}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            left={
                                <TextInput.Icon
                                    icon="lock-outline"
                                    size={24}
                                    style={styles.iconStyle}
                                />
                            }
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
                            style={[styles.dropdown]}
                            data={departments}
                            labelField="label"
                            valueField="value"
                            search
                            placeholder="Select Department"
                            value={teacherDepartment}
                            onChange={(item) => setTeacherDepartment(item.value)}
                        />
                    </View>
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
        </SafeAreaView >
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
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 4,
        color: "black",
        fontSize: 16,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 16,
    },
    imageSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconStyle: {
        marginRight: 10, // Space between icon and dropdown
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
        color: '#6c757d',
        fontSize: 16,
        textAlign: 'center',
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
        flex: 1, // Ensures dropdown takes remaining space
        height: '100%', // Matches the container height
        paddingHorizontal: 8,
        backgroundColor: 'white',
        fontSize: 16,
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
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    textInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        backgroundColor: 'white',
        justifyContent: 'center',
    },

});

export default AddTeacher;
