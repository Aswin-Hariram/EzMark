import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { TextInput, ActivityIndicator } from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Buffer } from 'buffer';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore, secondaryAuth } from '../../Config/FirebaseConfig';
import { s3 } from '../../Config/awsConfig';
import {
  createDropdownItems,
  departmentOptions,
  getInstitutionData,
} from './institutionData';

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

const AddTeacher = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const getTeachers = route.params?.getTeachers;
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState(null);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherImage, setTeacherImage] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInstitution = async () => {
      try {
        const { classes, subjects } = await getInstitutionData();
        setAvailableClasses(classes);
        setAvailableSubjects(subjects);
      } catch (error) {
        console.log('Error fetching institution data:', error);
        Alert.alert('Error', 'Failed to load classes and subjects.');
      }
    };

    loadInstitution();
  }, []);

  const classItems = useMemo(() => createDropdownItems(availableClasses), [availableClasses]);
  const subjectItems = useMemo(() => createDropdownItems(availableSubjects), [availableSubjects]);

  const toggleChip = (value, setter) => {
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value]
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setTeacherImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image.');
    }
  };

  const uploadImageToS3 = async (uri) => {
    if (!uri) {
      return '';
    }

    try {
      const fileName = uri.split('/').pop() || `${Date.now()}.jpg`;
      const fileType = fileName.split('.').pop();
      const buffer = await fetch(uri).then((response) => response.arrayBuffer());
      const params = {
        Bucket: 'ezmarkskct',
        Key: `teachers/${teacherEmail || Date.now()}-${fileName}`,
        Body: Buffer.from(buffer),
        ContentType: `image/${fileType}`,
      };
      const data = await s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.log('Error uploading teacher image:', error);
      Alert.alert('Error', 'Failed to upload teacher image.');
      return null;
    }
  };

  const validate = () => {
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherDepartment || !teacherPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return false;
    }

    if (!emailRegex.test(teacherEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!passwordRegex.test(teacherPassword.trim())) {
      Alert.alert(
        'Weak Password',
        'Password must include at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number.'
      );
      return false;
    }

    return true;
  };

  const handleSaveTeacher = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const imageUrl = await uploadImageToS3(teacherImage);
      if (imageUrl === null) {
        setLoading(false);
        return;
      }

      const newTeacher = {
        id: Date.now().toString(),
        name: teacherName.trim(),
        email: teacherEmail.trim().toLowerCase(),
        department: teacherDepartment,
        image: imageUrl || '',
        subjects: selectedSubjects,
        classes: selectedClasses,
        type: 'Teacher',
        password: teacherPassword.trim(),
      };

      await createUserWithEmailAndPassword(
        secondaryAuth,
        newTeacher.email,
        newTeacher.password
      );
      await setDoc(doc(firestore, 'UserData', newTeacher.id), newTeacher);
      await secondaryAuth.signOut();

      Alert.alert('Success', 'Teacher added successfully.');
      if (typeof getTeachers === 'function') {
        await getTeachers();
      }
      navigation.goBack();
    } catch (error) {
      console.log('Error saving teacher:', error);
      Alert.alert('Error', error.message || 'Failed to add teacher.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Add Teacher</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Create teaching profile</Text>
            <Text style={styles.heroSubtitle}>
              Assign classes and subjects now so attendance workflows are ready immediately.
            </Text>
          </View>
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {teacherImage ? (
              <Image source={{ uri: teacherImage }} style={styles.teacherImage} />
            ) : (
              <View style={styles.imagePlaceholderWrap}>
                <Ionicons name="image-outline" size={26} color={Colors.SECONDARY} />
                <Text style={styles.imagePlaceholder}>Upload</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <TextInput
            label="Teacher Name"
            value={teacherName}
            onChangeText={setTeacherName}
            mode="outlined"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="account-outline" />}
          />
          <TextInput
            label="Teacher Email"
            value={teacherEmail}
            onChangeText={setTeacherEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="email-outline" />}
          />
          <TextInput
            label="Password"
            value={teacherPassword}
            onChangeText={setTeacherPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye' : 'eye-off'}
                onPress={() => setShowPassword((previous) => !previous)}
              />
            }
          />

          <View style={styles.dropdownContainer}>
            <MaterialIcons name="domain" size={22} color={Colors.PRIMARY} />
            <Dropdown
              style={styles.dropdown}
              data={departmentOptions}
              labelField="label"
              valueField="value"
              search
              placeholder="Select Department"
              value={teacherDepartment}
              onChange={(item) => setTeacherDepartment(item.value)}
            />
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Class Allocation</Text>
          <Text style={styles.sectionHint}>Tap to assign one or more classes.</Text>
          <View style={styles.chipContainer}>
            {classItems.length ? classItems.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={selectedClasses.includes(item.value) ? styles.selectedChip : styles.chip}
                onPress={() => toggleChip(item.value, setSelectedClasses)}
              >
                <Text
                  style={selectedClasses.includes(item.value) ? styles.selectedChipText : styles.chipText}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No classes available yet. Create classes first.</Text>
            )}
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Subject Ownership</Text>
          <Text style={styles.sectionHint}>Keep subject mapping updated for request creation and reporting.</Text>
          <View style={styles.chipContainer}>
            {subjectItems.length ? subjectItems.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={selectedSubjects.includes(item.value) ? styles.selectedChip : styles.chip}
                onPress={() => toggleChip(item.value, setSelectedSubjects)}
              >
                <Text
                  style={selectedSubjects.includes(item.value) ? styles.selectedChipText : styles.chipText}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )) : (
              <Text style={styles.emptyText}>No subjects available yet. Add subjects from admin.</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTeacher} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
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
    backgroundColor: '#F4F7FB',
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  scrollView: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  header: {
    height: 56,
    justifyContent: 'center',
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.PRIMARY,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5F7382',
  },
  imagePicker: {
    width: 94,
    height: 94,
    borderRadius: 22,
    backgroundColor: '#E9EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  teacherImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholderWrap: {
    alignItems: 'center',
    gap: 6,
  },
  imagePlaceholder: {
    color: Colors.SECONDARY,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.PRIMARY,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 13,
    color: '#6E7E8E',
    marginBottom: 12,
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#D7E0EA',
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  dropdown: {
    flex: 1,
    marginLeft: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EDF3F8',
  },
  selectedChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.PRIMARY,
  },
  chipText: {
    color: '#355164',
    fontWeight: '600',
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    color: '#738496',
    lineHeight: 20,
  },
  saveButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddTeacher;
