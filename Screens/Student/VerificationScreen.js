import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert, Modal, TextInput as RNTextInput, Platform, } from 'react-native';
import React, { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../assets/Colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { rekognition } from '../../Config/awsConfig';
import { Buffer } from 'buffer';
import { collection, getDocs, query, updateDoc, where, doc } from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';

const VerificationScreen = () => {
    const navigation = useNavigation();
    const { requestDetails, studentDetail } = useRoute().params;
    const [imageUri, setImageUri] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [isPicVerified, setIsPicVerified] = useState(false);
    const [isModalVisible, setModalVisible] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [similarityScore, setSimilarityScore] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [locationLat, setLocationLat] = useState('')
    const [locationLong, setLocationLong] = useState('')
    const [otpverifing,setOtpVerifing] = useState(false)

    const inputRefs = useRef([]);



    const compressImage = async (uri) => {
        try {
            const manipResult = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 800 } }], // Resize to optimize speed
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            return manipResult.uri;
        } catch (error) {
            console.log('Image compression error:', error);
            throw error;
        }
    };

    const convertToBase64 = async (uri) => {
        try {
            return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        } catch (error) {
            console.log('Error converting image to Base64:', error);
            throw error;
        }
    };
const getCachedImage = async (url) => {
    try {
        const fileUri = FileSystem.cacheDirectory + url.split('/').pop();
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists) {
            return fileUri;
        } else {
            const downloaded = await FileSystem.downloadAsync(url, fileUri);
            return downloaded.uri;
        }
    } catch (error) {
        console.log('Error caching image:', error);
        return url; // Fallback to URL if cache fails
    }
};

const compareFaces = async (selfieUri, targetImageUrl) => {
    let startTime = Date.now();  
    try {
        console.log("Starting face comparison...");
     

        setIsProcessing(true);
        const compressedSelfieUri = await compressImage(selfieUri);
        console.log("Selfie compressed in:", Date.now() - startTime, "ms");

        const cachedTargetImageUri = await getCachedImage(targetImageUrl);
        console.log("Target image cached in:", Date.now() - startTime, "ms");

        const [selfieBytes, targetBytes] = await Promise.all([
            convertToBase64(compressedSelfieUri),
            convertToBase64(cachedTargetImageUri)
        ]);
        console.log("Base64 conversion completed in:", Date.now() - startTime, "ms");

        const params = {
            SourceImage: { Bytes: new Uint8Array(Buffer.from(selfieBytes, 'base64')) },
            TargetImage: { Bytes: new Uint8Array(Buffer.from(targetBytes, 'base64')) },
            SimilarityThreshold: 70,
        };

        const rekognitionPromise = rekognition.compareFaces(params).promise();
        const data = await rekognitionPromise;
        console.log("AWS Rekognition response received in:", Date.now() - startTime, "ms");

        if (data.FaceMatches && data.FaceMatches.length > 0) {
            const score = data.FaceMatches[0].Similarity.toFixed(2);
            setSimilarityScore(score);
            setIsPicVerified(true);
        } else {
            setSimilarityScore(0);
            setIsPicVerified(false);
            Alert.alert('No Match', 'Faces do not match.');
        }
    } catch (error) {
        console.log('Comparison Error:', error);
        Alert.alert('Error', error.message || 'Failed to compare faces.');
    } finally {
        console.log("Total time taken:", Date.now() - startTime, "ms");  // Ensure startTime is defined
        setIsProcessing(false);
    }
};


    

    const handleSelfie = async () => {
        try {
            setIsProcessing(true);

            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (!permissionResult.granted) {
                Alert.alert('Permission Denied', 'Camera access is required to take a selfie.');
                setIsProcessing(false);
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                setImageUri(uri);
                await compareFaces(uri, studentDetail.image);
            } else {
                setIsProcessing(false);
            }
        } catch (error) {
            setIsProcessing(false);
            console.log('Selfie Capture Error:', error);
            Alert.alert('Error', 'Failed to capture selfie.');
        }
    };

    const renderMessage = () => (
        <View style={styles.container}>
            <Text style={styles.verifyText}>Verify Your Face</Text>
            <Text style={styles.subtext}>Have fun and smile for your photo!</Text>
            <View style={styles.avatarContainer}>
                <LottieView source={require('../../assets/face.json')} autoPlay loop style={styles.avatar} />
            </View>
            <TouchableOpacity
                style={[styles.takeSelfie, isProcessing && styles.disabledButton]}
                onPress={handleSelfie}
                disabled={isProcessing}
            >
                <Text style={styles.btnText}>{isProcessing ? 'Analysing...' : 'Take Selfie'}</Text>
            </TouchableOpacity>
        </View>
    );


    const handleOtpChange = (text, index) => {
        const updatedOtp = [...otp];
        updatedOtp[index] = text.replace(/[^0-9]/g, ''); // Allow only numeric input
        setOtp(updatedOtp);

        if (text.length === 1 && index < 3) {
            inputRefs.current[index + 1]?.focus(); // Focus next input
        }
    };

    const updateFirestore = async (otpValue) => {
        try {
            console.log("Starting updateFirestore...");
         
            let currentLocation = await Location.getCurrentPositionAsync({});
            if (!currentLocation)
                throw new Error("Missing location permission");
            if (!studentDetail || !studentDetail.id || !requestDetails) {
                throw new Error("Missing studentDetail or requestDetails.");
            }
            setIsUpdating(true)
            setOtpVerifing(true)
            const attendanceRef = collection(
                firestore,
                `UserData/${studentDetail.id}/AttendanceRequests`
            );





            const attendanceQuery = query(
                attendanceRef,
                where("status", "==", "Requested"),
                where("createdBy", "==", requestDetails.createdBy),
                where("createdAt", "==", requestDetails.createdAt),
                where("id", "==", requestDetails.id)
            );

            const snapshot = await getDocs(attendanceQuery);

            if (snapshot.empty) {
                console.warn("No matching AttendanceRequests found for the student.");
                return;
            }

            await Promise.all(snapshot.docs.map(async (docSnapshot) => {
                const docRef = doc(
                    firestore,
                    `UserData/${studentDetail.id}/AttendanceRequests`,
                    docSnapshot.id
                );

                await updateDoc(docRef, {
                    status: "Completed",
                    ctime: new Date().toISOString(),
                    locationLat: currentLocation.coords.latitude,
                    locationLong: currentLocation.coords.longitude
                });
            }));

            if (!requestDetails.teacherId) {
                throw new Error("Missing teacherId in requestDetails.");
            }

            const teacherAttendanceQuery = query(
                collection(firestore, `UserData/${requestDetails.teacherId}/AttendanceRequests`),
                where("createdAt", "==", requestDetails.createdAt),
                where("otp", "==", otpValue)
            );

            const teacherSnapshot = await getDocs(teacherAttendanceQuery);

            if (teacherSnapshot.empty) {
                console.warn("No matching teacher AttendanceRequests found.");
                return;
            }

            await Promise.all(teacherSnapshot.docs.map(async (d) => {
                const enrolledStudents = d.get("enrolledStudents") || [];

                if (!Array.isArray(enrolledStudents)) {
                    console.warn("Invalid enrolledStudents format.");
                    return;
                }






                const updatedStudents = enrolledStudents.map((student) => {
                    if (
                        student.email === auth.currentUser.email
                    ) {
                        return { ...student, status: "Completed", ctime: new Date().toISOString(), locationLat: currentLocation.coords.latitude, locationLong: currentLocation.coords.longitude };
                    }
                    return student;
                });
                console.log("updatedStudents", updatedStudents)
                const teacherDocRef = doc(
                    firestore,
                    `UserData/${requestDetails.teacherId}/AttendanceRequests`,
                    d.id
                );

                await updateDoc(teacherDocRef, {
                    enrolledStudents: updatedStudents,
                    pendingNumberOfStudents: d.get("pendingNumberOfStudents") - 1,

                });
            }));

            console.log("Firestore updates completed successfully.");
        } catch (err) {
            console.log("Error updating Firestore:", err);
        } finally {
            setIsUpdating(false)
            setModalVisible(false)
            setOtpVerifing(false)
            navigation.goBack()
        }
    };


    const handleOtpSubmit = async () => {
        console.log("Verify pressed...")
        const otpValue = otp.join('');

        if (otp.some((digit) => digit === '')) {
            Alert.alert('Validation Error', 'Please enter all 4 digits of the OTP.');
            return;
        }

        if (otpValue.length !== 4 || isNaN(otpValue)) {
            Alert.alert('Validation Error', 'OTP must be a 4-digit numeric value.');
            return;
        }



        try {
            console.log("otpValue: ", otpValue)
            console.log("RequestDetails: ", requestDetails)
            if (otpValue === requestDetails.otp) {

                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setErrorMsg('Permission to access location was denied');
                    return;
                }
                updateFirestore(otpValue)

            }
        } catch (error) {
            console.log('Error creating request:', error);
            Alert.alert('Error', 'Failed to create attendance request. Please try again later.');
        }
        finally {
            setisProcessing(false)
            navigation.goBack();
        }
    };



    const renderMarkAttendance = () => (
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
                        <TouchableOpacity onPress={() => {

                            Alert.alert("Are you sure", "Do you want to cancel the process", [
                                {
                                    text: "Yes",
                                    onPress: () => {
                                        setModalVisible(false)
                                        setIsPicVerified(false)
                                    }
                                },
                                {
                                    text: "No",
                                    onPress: () => {

                                    }
                                }
                            ])
                        }}>
                            <AntDesign name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                   { !otpverifing?<View style={styles.otpContainer}>
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
                    </View>:
                    <View>
                        <LottieView source={require('../../assets/pin.json')} autoPlay loop style={{width:'100%',height:'230',overflow:'hidden',alignSelf:'center'}} />
                    </View>}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleOtpSubmit}
                        disabled={isUpdating}
                    >
                        {
                            !isUpdating ? <Text style={styles.submitButtonText}>Verify</Text> :
                                <ActivityIndicator size='small' color="white" />
                        }

                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </View>
            {!isPicVerified ? renderMessage() : renderMarkAttendance()}
        </SafeAreaView>
    );
};

export default VerificationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: Platform.OS === "android" ? 30 : 0
    },
    leftIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        marginLeft: 8,
        color: Colors.PRIMARY,
        fontSize: 16,
        fontFamily: 'Metro-regular',
    },
    verifyText: {
        fontSize: 32,
        fontFamily: 'Signika-Bold',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtext: {
        fontSize: 16,
        marginTop: 10,
        fontFamily: 'Signika-Regular',
        color: '#717170',
        textAlign: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    avatar: {
        width: 250,
        height: 200,
    },
    takeSelfie: {
        backgroundColor: Colors.SECONDARY,
        paddingHorizontal: 50,
        paddingVertical: 15,
        borderRadius: 10,
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
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
    btnText: {
        color: 'white',
        fontFamily: 'Metro-Regular',
        fontSize: 18,
        textAlign: 'center',
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
    },
});
