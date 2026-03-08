import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TextInput as RNTextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { ActivityIndicator } from 'react-native-paper';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import { rekognition } from '../../Config/awsConfig';
import { auth, firestore } from '../../Config/FirebaseConfig';
import {
  calculateDistanceMeters,
  DEFAULT_GEOFENCE_RADIUS_METERS,
  normalizeRadius,
  parseAttendanceQrPayload,
} from '../../utils/attendance';

const FACE_MATCH_THRESHOLD = 70;
const LIVENESS_REQUIREMENTS = {
  minFaceConfidence: 90,
  minBrightness: 30,
  minSharpness: 35,
  maxPoseOffset: 20,
};

const VerificationScreen = () => {
  const navigation = useNavigation();
  const { requestDetails, studentDetail } = useRoute().params;
  const [resolvedRequest, setResolvedRequest] = useState(requestDetails);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isPicVerified, setIsPicVerified] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [livenessScore, setLivenessScore] = useState(0);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [scannerLocked, setScannerLocked] = useState(false);
  const [isResolvingRequest, setIsResolvingRequest] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const inputRefs = useRef([]);

  const activeRequest = resolvedRequest || requestDetails;
  const requestId = activeRequest?.requestId || activeRequest?.id;
  const canAttemptQrScan = Boolean(activeRequest?.teacherId);
  const geofenceRadiusMeters = normalizeRadius(
    activeRequest?.geofenceRadiusMeters,
    DEFAULT_GEOFENCE_RADIUS_METERS
  );
  const hasQrFallback = Boolean(activeRequest?.qrToken && requestId && activeRequest?.teacherId);

  useEffect(() => {
    let isMounted = true;

    const resolveTeacherRequest = async () => {
      if (!requestDetails?.teacherId) {
        return;
      }

      if (requestDetails?.qrToken && requestDetails?.requestLocation && requestDetails?.geofenceRadiusMeters) {
        return;
      }

      try {
        setIsResolvingRequest(true);

        const teacherRequestRef = collection(
          firestore,
          `UserData/${requestDetails.teacherId}/AttendanceRequests`
        );

        const teacherRequestQuery = requestDetails?.requestId
          ? query(teacherRequestRef, where('requestId', '==', requestDetails.requestId))
          : query(
              teacherRequestRef,
              where('createdAt', '==', requestDetails.createdAt)
            );

        const teacherSnapshot = await getDocs(teacherRequestQuery);

        if (!teacherSnapshot.empty && isMounted) {
          const teacherRecord = teacherSnapshot.docs[0];
          setResolvedRequest((currentValue) => ({
            ...(currentValue || {}),
            id: currentValue?.id || requestDetails?.id,
            ...teacherRecord.data(),
          }));
        }
      } catch (error) {
        console.log('Error resolving teacher request metadata:', error);
      } finally {
        if (isMounted) {
          setIsResolvingRequest(false);
        }
      }
    };

    resolveTeacherRequest();

    return () => {
      isMounted = false;
    };
  }, [
    requestDetails?.createdAt,
    requestDetails?.geofenceRadiusMeters,
    requestDetails?.qrToken,
    requestDetails?.requestId,
    requestDetails?.requestLocation,
    requestDetails?.teacherId,
  ]);

  const compressImage = async (uri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.log('Image compression error:', error);
      throw error;
    }
  };

  const getCachedImage = async (url) => {
    try {
      const fileName = url.split('/').pop()?.split('?')[0] || 'cached-image.jpg';
      const cachedFile = new File(Paths.cache, fileName);

      if (cachedFile.exists) {
        return cachedFile.uri;
      }

      const downloaded = await File.downloadFileAsync(url, cachedFile, { idempotent: true });
      return downloaded.uri;
    } catch (error) {
      console.log('Error caching image:', error);
      throw error;
    }
  };

  const buildImageBytes = async (uri) => new File(uri).bytes();

  const getLivenessFailureReason = (faceDetails) => {
    if (!faceDetails || faceDetails.length === 0) {
      return 'No face detected. Center your face in the frame and try again.';
    }

    if (faceDetails.length > 1) {
      return 'Only one face can be present during verification.';
    }

    const [face] = faceDetails;
    const brightness = face.Quality?.Brightness ?? 0;
    const sharpness = face.Quality?.Sharpness ?? 0;
    const yaw = Math.abs(face.Pose?.Yaw ?? 0);
    const pitch = Math.abs(face.Pose?.Pitch ?? 0);

    if ((face.Confidence ?? 0) < LIVENESS_REQUIREMENTS.minFaceConfidence) {
      return 'Move closer and keep your full face inside the frame.';
    }

    if (!face.EyesOpen?.Value) {
      return 'Keep your eyes open and look at the camera.';
    }

    if (face.FaceOccluded?.Value) {
      return 'Remove anything blocking your face and try again.';
    }

    if (brightness < LIVENESS_REQUIREMENTS.minBrightness) {
      return 'Lighting is too low. Move to a brighter area and retry.';
    }

    if (sharpness < LIVENESS_REQUIREMENTS.minSharpness) {
      return 'Hold the camera steady so the image is not blurry.';
    }

    if (yaw > LIVENESS_REQUIREMENTS.maxPoseOffset || pitch > LIVENESS_REQUIREMENTS.maxPoseOffset) {
      return 'Look straight at the camera for face liveness verification.';
    }

    return null;
  };

  const calculateLivenessScore = (face) => {
    const scoreParts = [
      face.Confidence ?? 0,
      face.Quality?.Brightness ?? 0,
      face.Quality?.Sharpness ?? 0,
      face.EyesOpen?.Value ? 100 : 0,
      face.FaceOccluded?.Value ? 0 : 100,
    ];

    return Number(
      (scoreParts.reduce((total, value) => total + value, 0) / scoreParts.length).toFixed(2)
    );
  };

  const verifyIdentity = async (selfieUri, targetImageUrl) => {
    try {
      setIsProcessing(true);
      setIsPicVerified(false);
      setOtpModalVisible(false);
      setSimilarityScore(0);
      setLivenessScore(0);
      setVerificationMessage('');

      const compressedSelfieUri = await compressImage(selfieUri);
      const cachedTargetImageUri = await getCachedImage(targetImageUrl);

      const [selfieBytes, targetBytes] = await Promise.all([
        buildImageBytes(compressedSelfieUri),
        buildImageBytes(cachedTargetImageUri),
      ]);

      const [livenessData, faceMatchData] = await Promise.all([
        rekognition.detectFaces({
          Image: { Bytes: selfieBytes },
          Attributes: ['ALL'],
        }).promise(),
        rekognition.compareFaces({
          SourceImage: { Bytes: selfieBytes },
          TargetImage: { Bytes: targetBytes },
          SimilarityThreshold: FACE_MATCH_THRESHOLD,
        }).promise(),
      ]);

      const livenessFailureReason = getLivenessFailureReason(livenessData.FaceDetails);

      if (livenessFailureReason) {
        setLivenessScore(0);
        setSimilarityScore(0);
        setVerificationMessage(
          `${livenessFailureReason}${hasQrFallback ? ' You can also use the teacher QR scanner option.' : ''}`
        );
        Alert.alert(
          'Face Liveness Failed',
          `${livenessFailureReason}${hasQrFallback ? ' You can use the teacher QR scanner instead.' : ''}`
        );
        return;
      }

      if (!faceMatchData.FaceMatches || faceMatchData.FaceMatches.length === 0) {
        setLivenessScore(calculateLivenessScore(livenessData.FaceDetails[0]));
        setSimilarityScore(0);
        setVerificationMessage(
          `Your selfie did not match the registered profile.${hasQrFallback ? ' You can still mark attendance with the teacher QR scanner.' : ''}`
        );
        Alert.alert(
          'Face Match Failed',
          `Your live selfie does not match the profile image on record.${hasQrFallback ? ' You can use the teacher QR scanner instead.' : ''}`
        );
        return;
      }

      setLivenessScore(calculateLivenessScore(livenessData.FaceDetails[0]));
      setSimilarityScore(Number(faceMatchData.FaceMatches[0].Similarity.toFixed(2)));
      setVerificationMessage(
        hasQrFallback
          ? 'Face verification passed. You can continue with OTP or scan the teacher QR.'
          : 'Face verification passed. Complete attendance with OTP.'
      );
      setIsPicVerified(true);
      setOtpModalVisible(true);
    } catch (error) {
      console.log('Verification Error:', error);
      Alert.alert('Error', error.message || 'Failed to verify face.');
    } finally {
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
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await verifyIdentity(result.assets[0].uri, studentDetail.image);
      }
    } catch (error) {
      console.log('Selfie Capture Error:', error);
      Alert.alert('Error', 'Failed to capture selfie.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const updatedOtp = [...otp];
    updatedOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(updatedOtp);

    if (text.length === 1 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const getCurrentStudentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Permission to access location was denied.');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Platform.OS === 'android'
        ? Location.Accuracy.Balanced
        : Location.Accuracy.High,
    });

    if (!location?.coords) {
      throw new Error('Unable to determine your current location.');
    }

    return location.coords;
  };

  const validateGeofence = (coords) => {
    const requestLocation = activeRequest?.requestLocation;

    if (!requestLocation?.latitude || !requestLocation?.longitude) {
      return {
        distanceMeters: null,
      };
    }

    const distanceMeters = calculateDistanceMeters(
      {
        latitude: requestLocation.latitude,
        longitude: requestLocation.longitude,
      },
      {
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    );

    if (distanceMeters === null) {
      throw new Error('Unable to validate the request geo-fence.');
    }

    if (distanceMeters > geofenceRadiusMeters) {
      throw new Error(
        `You are ${distanceMeters}m away from the teacher location. Move within ${geofenceRadiusMeters}m and try again.`
      );
    }

    return { distanceMeters };
  };

  const updateStudentRequest = async (completionPayload) => {
    const studentAttendanceRef = collection(
      firestore,
      `UserData/${studentDetail.id}/AttendanceRequests`
    );

    const studentAttendanceQuery = requestId
      ? query(
          studentAttendanceRef,
          where('status', '==', 'Requested'),
          where('requestId', '==', requestId)
        )
      : query(
          studentAttendanceRef,
          where('status', '==', 'Requested'),
          where('createdAt', '==', activeRequest?.createdAt)
        );

    const snapshot = await getDocs(studentAttendanceQuery);

    if (snapshot.empty) {
      throw new Error('No matching attendance request was found for this student.');
    }

    await Promise.all(snapshot.docs.map(async (docSnapshot) => {
      await updateDoc(
        doc(firestore, `UserData/${studentDetail.id}/AttendanceRequests`, docSnapshot.id),
        completionPayload
      );
    }));
  };

  const updateTeacherRequest = async (completionPayload) => {
    if (!activeRequest?.teacherId) {
      throw new Error('Missing teacher information for this request.');
    }

    const teacherAttendanceRef = collection(
      firestore,
      `UserData/${activeRequest.teacherId}/AttendanceRequests`
    );

    const teacherAttendanceQuery = requestId
      ? query(teacherAttendanceRef, where('requestId', '==', requestId))
      : query(teacherAttendanceRef, where('createdAt', '==', activeRequest?.createdAt));

    const teacherSnapshot = await getDocs(teacherAttendanceQuery);

    if (teacherSnapshot.empty) {
      throw new Error('No matching teacher attendance request was found.');
    }

    await Promise.all(teacherSnapshot.docs.map(async (teacherDocSnapshot) => {
      const enrolledStudents = teacherDocSnapshot.get('enrolledStudents') || [];
      const updatedStudents = enrolledStudents.map((student) => (
        student.email === auth.currentUser?.email
          ? {
              ...student,
              ...completionPayload,
            }
          : student
      ));

      const pendingCount = updatedStudents.filter((student) => student.status === 'Requested').length;

      await updateDoc(
        doc(firestore, `UserData/${activeRequest.teacherId}/AttendanceRequests`, teacherDocSnapshot.id),
        {
          enrolledStudents: updatedStudents,
          pendingNumberOfStudents: pendingCount,
        }
      );
    }));
  };

  const completeAttendance = async ({ methodLabel }) => {
    try {
      setIsUpdating(true);

      const currentCoords = await getCurrentStudentLocation();
      const { distanceMeters } = validateGeofence(currentCoords);
      const completedAt = new Date().toISOString();
      const completionPayload = {
        status: 'Completed',
        ctime: completedAt,
        locationLat: currentCoords.latitude,
        locationLong: currentCoords.longitude,
        attendanceMethod: methodLabel,
        locationDistanceMeters: distanceMeters ?? '',
      };

      await Promise.all([
        updateStudentRequest(completionPayload),
        updateTeacherRequest(completionPayload),
      ]);

      Alert.alert(
        'Attendance Marked',
        `Attendance marked successfully using ${methodLabel}.`,
        [
          {
            text: 'OK',
            onPress: returnToStudentWorkspace,
          },
        ]
      );
    } catch (error) {
      console.log('Error updating Firestore:', error);
      Alert.alert('Unable to Mark Attendance', error.message || 'Please try again.');
    } finally {
      setIsUpdating(false);
      setQrModalVisible(false);
      setOtpModalVisible(false);
    }
  };

  const handleOtpSubmit = async () => {
    const otpValue = otp.join('');

    if (otp.some((digit) => digit === '')) {
      Alert.alert('Validation Error', 'Please enter all 4 digits of the OTP.');
      return;
    }

    if (otpValue.length !== 4 || Number.isNaN(Number(otpValue))) {
      Alert.alert('Validation Error', 'OTP must be a 4-digit numeric value.');
      return;
    }

    if (otpValue !== activeRequest?.otp) {
      Alert.alert('Invalid OTP', 'The OTP does not match the active attendance request.');
      return;
    }

    await completeAttendance({ methodLabel: 'Face + OTP' });
  };

  const openQrScanner = async () => {
    if (!hasQrFallback) {
      Alert.alert('QR Unavailable', 'This attendance request does not include a teacher QR code yet.');
      return;
    }

    if (isResolvingRequest) {
      Alert.alert('Preparing QR', 'Loading the teacher attendance QR details. Try again in a moment.');
      return;
    }

    const permissionResponse = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (!permissionResponse?.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to scan the teacher QR code.');
      return;
    }

    setScannerLocked(false);
    setQrModalVisible(true);
  };

  const handleQrScanned = async ({ data }) => {
    if (scannerLocked || isUpdating) {
      return;
    }

    setScannerLocked(true);
    const parsedPayload = parseAttendanceQrPayload(data);

    if (
      !parsedPayload
      || parsedPayload.requestId !== requestId
      || parsedPayload.teacherId !== activeRequest?.teacherId
      || parsedPayload.createdAt !== activeRequest?.createdAt
      || parsedPayload.qrToken !== activeRequest?.qrToken
    ) {
      Alert.alert('Invalid QR Code', 'This QR code does not match the selected attendance request.');
      setScannerLocked(false);
      return;
    }

    await completeAttendance({ methodLabel: 'Teacher QR Fallback' });
  };

  const requestMeta = useMemo(() => (
    `${activeRequest?.subjectName || 'Attendance'} • ${activeRequest?.createdBy || 'Teacher'}`
  ), [activeRequest?.createdBy, activeRequest?.subjectName]);

  const returnToStudentWorkspace = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'StudentDashBoard' }],
    });
  };

  const renderMessage = () => (
    <View style={styles.screenContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.verifyText}>Identity Verification</Text>
          <Text style={styles.subtext}>
            Capture a live selfie. We check liveness first, then compare it with your registered profile image.
          </Text>
        </View>
        <LottieView source={require('../../assets/face.json')} autoPlay loop style={styles.avatar} />
      </View>

      <View style={styles.metaCard}>
        <View style={styles.metaStat}>
          <Text style={styles.metaLabel}>Request</Text>
          <Text style={styles.metaValue}>{requestMeta}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaStat}>
          <Text style={styles.metaLabel}>Geo-fence</Text>
          <Text style={styles.metaValue}>{geofenceRadiusMeters}m radius</Text>
        </View>
      </View>

      {verificationMessage ? (
        <View style={hasQrFallback ? styles.messageCardWarning : styles.messageCardSuccess}>
          <Text style={styles.messageCardTitle}>
            {hasQrFallback ? 'Attendance Options' : 'Status Update'}
          </Text>
          <Text style={styles.messageCardText}>{verificationMessage}</Text>
        </View>
      ) : null}

      <View style={styles.stepCard}>
        <Text style={styles.stepTitle}>How it works</Text>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
          <Text style={styles.stepText}>Use the front camera in good lighting.</Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
          <Text style={styles.stepText}>Stay within the teacher request location radius before you submit attendance.</Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
          <Text style={styles.stepText}>Use OTP after face verification, or scan the teacher QR whenever you prefer.</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.takeSelfie, isProcessing && styles.disabledButton]}
        onPress={handleSelfie}
        disabled={isProcessing || isUpdating}
      >
        <Text style={styles.btnText}>{isProcessing ? 'Verifying...' : 'Capture & Verify'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.qrFallbackButton,
          (!canAttemptQrScan || isUpdating) && styles.qrFallbackButtonDisabled,
        ]}
        onPress={openQrScanner}
        disabled={!canAttemptQrScan || isUpdating}
      >
        <MaterialIcons name="qr-code-scanner" size={20} color={canAttemptQrScan ? Colors.PRIMARY : '#90A1AE'} />
        <Text style={canAttemptQrScan ? styles.qrFallbackText : styles.qrFallbackTextDisabled}>
          {isResolvingRequest ? 'Preparing QR...' : 'Scan Teacher QR'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOtpModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={otpModalVisible}
      onRequestClose={() => setOtpModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <TouchableOpacity
              onPress={() => {
                setOtpModalVisible(false);
                setOtp(['', '', '', '']);
                setIsPicVerified(false);
              }}
            >
              <AntDesign name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Liveness</Text>
              <Text style={styles.scoreValue}>{livenessScore > 0 ? livenessScore.toFixed(0) : '--'}</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Match</Text>
              <Text style={styles.scoreValue}>{similarityScore > 0 ? similarityScore.toFixed(0) : '--'}</Text>
            </View>
          </View>

          <View style={styles.otpContainer}>
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

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleOtpSubmit}
            disabled={isUpdating}
          >
            {!isUpdating ? (
              <Text style={styles.submitButtonText}>Verify & Mark Attendance</Text>
            ) : (
              <ActivityIndicator size="small" color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderQrModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={qrModalVisible}
      onRequestClose={() => setQrModalVisible(false)}
    >
      <View style={styles.qrModalBackdrop}>
        <View style={styles.qrModalCard}>
          <View style={styles.qrModalHeader}>
            <View>
              <Text style={styles.qrModalTitle}>Scan Teacher QR</Text>
              <Text style={styles.qrModalSubtitle}>Align the QR inside the frame to complete attendance.</Text>
            </View>
            <TouchableOpacity onPress={() => setQrModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrCameraShell}>
            <CameraView
              style={styles.qrCamera}
              facing="back"
              onBarcodeScanned={scannerLocked ? undefined : handleQrScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <View style={styles.qrFrame} />
          </View>

          <View style={styles.qrInfoCard}>
              <Text style={styles.qrInfoTitle}>{activeRequest?.subjectName}</Text>
              <Text style={styles.qrInfoText}>
                You still need to be inside the {geofenceRadiusMeters}m geo-fence for this request.
              </Text>
          </View>

          {isUpdating ? (
            <View style={styles.qrLoadingRow}>
              <ActivityIndicator size="small" color={Colors.PRIMARY} />
              <Text style={styles.qrLoadingText}>Completing attendance...</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      {renderMessage()}
      {renderOtpModal()}
      {renderQrModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EFF4F8',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 8,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  verifyText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 15,
    color: '#D7E1EA',
    lineHeight: 22,
  },
  heroCard: {
    backgroundColor: '#102B3C',
    borderRadius: 28,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  avatar: {
    width: 132,
    height: 132,
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaStat: {
    flex: 1,
  },
  metaLabel: {
    color: '#748493',
    marginBottom: 6,
  },
  metaValue: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 16,
  },
  metaDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#E2EAF0',
    marginHorizontal: 12,
  },
  messageCardWarning: {
    backgroundColor: '#FFF4E5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  messageCardSuccess: {
    backgroundColor: '#E8F7EE',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  messageCardTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    marginBottom: 6,
  },
  messageCardText: {
    color: '#5E7383',
    lineHeight: 20,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  stepTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: '#5F7484',
    lineHeight: 20,
  },
  takeSelfie: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#A9A9A9',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  qrFallbackButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E2EA',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  qrFallbackButtonDisabled: {
    backgroundColor: '#F4F7FB',
  },
  qrFallbackText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  qrFallbackTextDisabled: {
    color: '#90A1AE',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    width: '86%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
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
    color: Colors.PRIMARY,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#F0F5F8',
    borderRadius: 16,
    padding: 14,
  },
  scoreLabel: {
    color: '#6E7F8E',
    marginBottom: 6,
  },
  scoreValue: {
    color: Colors.PRIMARY,
    fontSize: 20,
    fontWeight: '800',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#D5E0E8',
    borderRadius: 16,
    backgroundColor: '#F4F7FB',
    textAlign: 'center',
    fontSize: 18,
    color: Colors.PRIMARY,
  },
  submitButton: {
    backgroundColor: '#153448',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  qrModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  qrModalTitle: {
    color: Colors.PRIMARY,
    fontSize: 22,
    fontWeight: '800',
  },
  qrModalSubtitle: {
    marginTop: 4,
    color: '#6D8191',
    lineHeight: 20,
    maxWidth: 250,
  },
  qrCameraShell: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 320,
    marginBottom: 14,
    backgroundColor: '#102B3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCamera: {
    width: '100%',
    height: '100%',
  },
  qrFrame: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 24,
  },
  qrInfoCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#F4F7FB',
  },
  qrInfoTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    marginBottom: 6,
  },
  qrInfoText: {
    color: '#627786',
    lineHeight: 20,
  },
  qrLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  qrLoadingText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
});

export default VerificationScreen;
