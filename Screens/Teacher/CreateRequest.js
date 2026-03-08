import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDoc, collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import * as Location from 'expo-location';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';
import { getInstitutionData } from '../Admin/institutionData';
import {
  createAttendanceQrToken,
  DEFAULT_GEOFENCE_RADIUS_METERS,
  normalizeRadius,
} from '../../utils/attendance';

const CreateRequest = () => {
  const navigation = useNavigation();
  const { teacherDetail } = useRoute().params;
  const inputRefs = useRef([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [subjectName, setSubjectName] = useState('');
  const [requestedClass, setRequestedClass] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState(`${DEFAULT_GEOFENCE_RADIUS_METERS}`);
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadInstitution = async () => {
      try {
        const institution = await getInstitutionData();
        const classes = teacherDetail?.classes?.length ? teacherDetail.classes : institution.classes;
        const subjects = teacherDetail?.subjects?.length ? teacherDetail.subjects : institution.subjects;

        setClassOptions(classes.map((item) => ({ label: item, value: item })));
        setSubjectOptions(subjects.map((item) => ({ label: item, value: item })));
      } catch (error) {
        console.log('Error fetching classes/subjects:', error);
        Alert.alert('Error', 'Failed to load classes and subjects.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInstitution();
  }, [teacherDetail?.classes, teacherDetail?.subjects]);

  const handleOtpChange = (text, index) => {
    const nextOtp = [...otp];
    nextOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(nextOtp);

    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const otpValue = useMemo(() => otp.join(''), [otp]);
  const normalizedRadius = useMemo(
    () => normalizeRadius(geofenceRadius, DEFAULT_GEOFENCE_RADIUS_METERS),
    [geofenceRadius]
  );

  const resetForm = () => {
    setModalVisible(false);
    setOtp(['', '', '', '']);
    setSubjectName('');
    setRequestedClass('');
    setGeofenceRadius(`${DEFAULT_GEOFENCE_RADIUS_METERS}`);
  };

  const handleOtpSubmit = async () => {
    if (otp.some((digit) => digit === '')) {
      Alert.alert('Validation Error', 'Please enter all 4 digits of the OTP.');
      return;
    }

    if (otpValue.length !== 4 || Number.isNaN(Number(otpValue))) {
      Alert.alert('Validation Error', 'OTP must be a 4-digit numeric value.');
      return;
    }

    if (!requestedClass || !subjectName.trim()) {
      Alert.alert('Validation Error', 'Please select a class and subject.');
      return;
    }

    try {
      setIsProcessing(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Location permission is required to create a geo-fenced attendance request.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'android'
          ? Location.Accuracy.Balanced
          : Location.Accuracy.High,
      });

      if (!currentLocation?.coords) {
        throw new Error('Unable to capture the teacher location for this request.');
      }

      const time = new Date().toISOString();
      const requestId = Date.now().toString();
      const qrToken = createAttendanceQrToken();
      const requestLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        capturedAt: time,
      };

      const requestData = {
        id: requestId,
        requestId,
        class: requestedClass,
        subjectName: subjectName.trim(),
        createdBy: teacherDetail.name,
        otp: otpValue,
        createdAt: time,
        status: 'Requested',
        teacherId: teacherDetail.id,
        requestLocation,
        geofenceRadiusMeters: normalizedRadius,
        qrToken,
      };

      const studentQuery = query(
        collection(firestore, 'UserData'),
        where('class', '==', requestedClass),
        where('type', '==', 'Student')
      );

      const querySnapshot = await getDocs(studentQuery);

      if (querySnapshot.empty) {
        Alert.alert('No Students Found', `No students enrolled in class: ${requestedClass}`);
        return;
      }

      const enrolledStudents = [];

      for (const userDoc of querySnapshot.docs) {
        const userId = userDoc.id;
        enrolledStudents.push({
          email: userDoc.get('email'),
          status: 'Requested',
          id: userId,
          rollno: userDoc.get('rollno'),
          locationLat: '',
          locationLong: '',
          ctime: '',
          attendanceMethod: '',
          locationDistanceMeters: '',
        });

        const nestedDocRef = doc(collection(firestore, `UserData/${userId}/AttendanceRequests`));
        await setDoc(nestedDocRef, requestData);
      }

      await addDoc(collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`), {
        requestId,
        class: requestedClass,
        subjectName: subjectName.trim(),
        createdBy: teacherDetail.name,
        teacherId: teacherDetail.id,
        teacherDepartment: teacherDetail.department,
        otp: otpValue,
        createdAt: time,
        status: 'Requested',
        requestLocation,
        geofenceRadiusMeters: normalizedRadius,
        qrToken,
        enrolledStudents,
        totalNumberOfStudents: enrolledStudents.length,
        pendingNumberOfStudents: enrolledStudents.length,
      });

      Alert.alert('Success', `Attendance request created for ${requestedClass}.`);
      resetForm();
      navigation.goBack();
    } catch (error) {
      console.log('Error creating request:', error);
      Alert.alert('Error', error.message || 'Failed to create attendance request.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Create Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Launch attendance in two steps</Text>
            <Text style={styles.heroSubtitle}>
              Select the teaching context first, then secure the request with a quick OTP.
            </Text>
          </View>
          <LottieView
            source={require('../../assets/createReq.json')}
            autoPlay
            loop
            style={styles.heroAnimation}
          />
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewStat}>
            <Text style={styles.previewLabel}>Class</Text>
            <Text style={styles.previewValue}>{requestedClass || 'Not selected'}</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewStat}>
            <Text style={styles.previewLabel}>Subject</Text>
            <Text style={styles.previewValue}>{subjectName || 'Not selected'}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Setup Session</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.PRIMARY} />
          ) : (
            <>
              <Dropdown
                style={styles.dropdown}
                data={subjectOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Subject"
                search
                value={subjectName}
                onChange={(item) => setSubjectName(item.value)}
              />
              <Dropdown
                style={styles.dropdown}
                data={classOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Class"
                search
                value={requestedClass}
                onChange={(item) => setRequestedClass(item.value)}
              />
              <View style={styles.radiusCard}>
                <Text style={styles.radiusLabel}>Geo-fence Radius (meters)</Text>
                <RNTextInput
                  style={styles.radiusInput}
                  value={geofenceRadius}
                  onChangeText={(text) => setGeofenceRadius(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder={`${DEFAULT_GEOFENCE_RADIUS_METERS}`}
                  placeholderTextColor="#93A4B2"
                />
                <Text style={styles.radiusHint}>
                  Students must verify inside approximately {normalizedRadius} meters of this request location.
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.openOtpButton}
            onPress={() => {
              if (!requestedClass || !subjectName) {
                Alert.alert('Validation Error', 'Please choose class and subject before continuing.');
                return;
              }
              setModalVisible(true);
            }}
          >
            <MaterialIcons name="verified-user" size={20} color="#FFFFFF" />
            <Text style={styles.openOtpButtonText}>Continue To OTP</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent animationType="slide" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Secure the Request</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.PRIMARY} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Share this OTP with students to confirm attendance for {requestedClass}.
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={`${index}`}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  returnKeyType={index === 3 ? 'done' : 'next'}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Preview</Text>
              <Text style={styles.summaryValue}>{subjectName}</Text>
              <Text style={styles.summaryCaption}>{requestedClass} • OTP {otpValue || '----'}</Text>
              <Text style={styles.summaryCaption}>Geo-fence radius • {normalizedRadius}m</Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleOtpSubmit} disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Attendance Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 16,
  },
  backAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    color: Colors.PRIMARY,
    fontWeight: '700',
    fontSize: 16,
  },
  heroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#D7E1EA',
    lineHeight: 20,
  },
  heroAnimation: {
    width: 120,
    height: 120,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewStat: {
    flex: 1,
  },
  previewLabel: {
    color: '#728292',
    marginBottom: 6,
  },
  previewValue: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
  },
  previewDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E6EDF3',
    marginHorizontal: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  sectionTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 14,
  },
  dropdown: {
    height: 54,
    borderColor: '#D7E0EA',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  radiusCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#FBFCFE',
  },
  radiusLabel: {
    color: Colors.PRIMARY,
    fontWeight: '700',
    marginBottom: 8,
  },
  radiusInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    paddingHorizontal: 14,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
  },
  radiusHint: {
    marginTop: 10,
    color: '#6F8291',
    lineHeight: 19,
  },
  openOtpButton: {
    marginTop: 8,
    backgroundColor: Colors.SECONDARY,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  openOtpButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 27, 39, 0.35)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 22,
  },
  modalSubtitle: {
    color: '#718190',
    lineHeight: 20,
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#F4F7FB',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  summaryBox: {
    backgroundColor: '#EEF3F7',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  summaryLabel: {
    color: '#728292',
    marginBottom: 6,
  },
  summaryValue: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
  },
  summaryCaption: {
    color: '#587083',
    marginTop: 6,
  },
  createButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default CreateRequest;
