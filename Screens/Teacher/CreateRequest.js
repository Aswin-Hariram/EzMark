import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    Platform,
    Alert,
    Image,
    ScrollView,
    TextInput as RNTextInput,
    ActivityIndicator,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { firestore } from '../../Config/FirebaseConfig';
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const CreateRequest = () => {
    const navigation = useNavigation();
    const { teacherDetail } = useRoute().params;
    const [isModalVisible, setModalVisible] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputRefs = useRef([]);
    const [subjectName, setSubjectName] = useState('');
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const [requestedClass, setRequestedClass] = useState('');
    const [loading, setLoading] = useState(true);
    const [isProcessing, setisProcessing] = useState(false)

    const handleOtpChange = (text, index) => {
        const updatedOtp = [...otp];
        updatedOtp[index] = text.replace(/[^0-9]/g, ''); // Allow only numeric input
        setOtp(updatedOtp);

        if (text.length === 1 && index < 3) {
            inputRefs.current[index + 1]?.focus(); // Focus next input
        }
    };

    const handleOtpSubmit = async () => {
        const otpValue = otp.join('');

        if (otp.some((digit) => digit === '')) {
            Alert.alert('Validation Error', 'Please enter all 4 digits of the OTP.');
            return;
        }

        if (otpValue.length !== 4 || isNaN(otpValue)) {
            Alert.alert('Validation Error', 'OTP must be a 4-digit numeric value.');
            return;
        }

        if (!requestedClass || !subjectName.trim()) {
            Alert.alert('Validation Error', 'Please select a class and enter a subject name.');
            return;
        }

        try {
            const time = new Date().toISOString()
            const id = Date.now().toString()
            setisProcessing(true)
            const requestData = {
                id: id,
                class: requestedClass,
                subjectName: subjectName.trim(),
                createdBy: teacherDetail.name,
                otp: otpValue,
                createdAt: time,
                status: "Requested",
                teacherId: teacherDetail.id
            };



            const studentQuery = query(
                collection(firestore, "UserData"),
                where("class", "==", requestedClass),
                where("type", "==", "Student")
            );

            const querySnapshot = await getDocs(studentQuery);

            if (querySnapshot.empty) {
                Alert.alert('No Students Found', `No students enrolled in class: ${requestedClass}`);
                return;
            }
            const temp = []
            for (const userDoc of querySnapshot.docs) {
                const userId = userDoc.id;
                temp.push({ email: userDoc.get("email"), status: "Requested", id: userId, rollno: userDoc.get("rollno"), locationLat: "", locationLong: "", ctime: "" })
                const nestedDocRef = doc(collection(firestore, `UserData/${userId}/AttendanceRequests`));
                await setDoc(nestedDocRef, requestData);

            }

            const requestDataTeacher = {
                class: requestedClass,
                subjectName: subjectName.trim(),
                createdBy: teacherDetail.name,
                teacherDepartment: teacherDetail.department,
                otp: otpValue,
                createdAt: time,
                status: "Requested",
                enrolledStudents: temp,
                totalNumberOfStudents: temp.length,
                pendingNumberOfStudents: temp.length,
            };

            await addDoc(collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`), requestDataTeacher)
            Alert.alert('Success', `Attendance request created for class: ${requestedClass}`);
            resetForm();
        } catch (error) {
            console.error('Error creating request:', error);
            Alert.alert('Error', 'Failed to create attendance request. Please try again later.');
        }
        finally {
            setisProcessing(false)
            navigation.goBack();
        }
    };

    const resetForm = () => {
        setModalVisible(false);
        setOtp(['', '', '', '']);
        setSubjectName('');
        setRequestedClass('');
    };

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const docRef = doc(firestore, 'BasicData', 'Data');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.Class) {
                        setClasses(data.Class.map((cls) => ({ label: cls, value: cls })));
                    }
                    if (data.Subjects) {
                        setSubjects(data.Subjects.map((sub) => ({ label: sub, value: sub })));
                    }
                } else {
                    Alert.alert('Error', 'No class data found.');
                }
            } catch (error) {
                console.error('Error fetching classes:', error);
                Alert.alert('Error', 'Failed to load classes.');
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={28} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Create Request</Text>
                </View>

                <View style={styles.formSection}>
                    <Image style={styles.icon} source={require('../../assets/createImage.png')} />

                    {loading ? (
                        <ActivityIndicator size="small" color="#153448" />
                    ) : (
                        <>
                            <Dropdown
                                style={styles.dropdown}
                                data={subjects}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Subject"
                                search
                                value={subjectName}
                                onChange={(item) => setSubjectName(item.value)}
                            />
                            <Dropdown
                                style={styles.dropdown}
                                data={classes}
                                labelField="label"
                                valueField="value"
                                placeholder="Select Class"
                                value={requestedClass}
                                onChange={(item) => setRequestedClass(item.value)}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                            />
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => {
                            if (!requestedClass || !subjectName.trim()) {
                                Alert.alert('Validation Error', 'Please select a class and enter a subject name.');
                                return;
                            }
                            setModalVisible(true)
                        }}
                    >
                        <Text style={styles.submitButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enter OTP</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <AntDesign name="close" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <RNTextInput
                                    key={index}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    style={styles.otpInput}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    returnKeyType={index === 3 ? 'done' : 'next'}
                                    onKeyPress={({ nativeEvent }) => {
                                        if (
                                            nativeEvent.key === 'Backspace' &&
                                            otp[index] === '' &&
                                            index > 0
                                        ) {
                                            inputRefs.current[index - 1]?.focus();
                                        }
                                    }}
                                />
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleOtpSubmit}
                            disabled={isProcessing}
                        >
                            {
                                !isProcessing ? <Text style={styles.submitButtonText}>Create Request</Text> :
                                    <ActivityIndicator size='small' color="white" />
                            }

                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

export default CreateRequest;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
        marginVertical:Platform.OS==='android'?20:0,
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
    scrollView: {
        paddingBottom: 20,
    },
    formSection: {
        padding: 20,
    },
    inputField: {
        marginBottom: 15,
        backgroundColor: 'white',
    },
    dropdown: {
        height: 50,
        borderColor: '#153448',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    placeholderStyle: {
        fontSize: 16,
        color: '#999',
    },
    selectedTextStyle: {
        fontSize: 16,
        color: '#000',
    },
    submitButton: {
        backgroundColor: '#153448',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    otpInput: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: '#153448',
        borderRadius: 8,
        textAlign: 'center',
        fontSize: 18,
        color: '#000',
    },
    icon: {
        width: 200,
        height: 200,
        marginTop: 0,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom:20,
    },
});
