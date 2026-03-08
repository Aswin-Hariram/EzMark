import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import dp from "../../assets/Teachers/profile.png";
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import PasswordTextInput from '../../Components/PasswordTextInput';

const AdminProfile = () => {
  const route = useRoute();
  const { adminData } = route.params;
  const navigation = useNavigation();
  const [adminName, setAdminName] = useState(adminData.name);
  const [adminEmail, setAdminEmail] = useState(adminData.email);
  const [adminPassword, setAdminPassword] = useState(adminData.password);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const validateInput = () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

    if (!adminName.trim()) {
      Alert.alert('Invalid Input', 'Please enter admin name.');
      return false;
    }

    if (!emailRegex.test(adminEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!passwordRegex.test(adminPassword)) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number.'
      );
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateInput()) return;

    setLoading(true);
    try {
      const adminRef = doc(firestore, 'UserData', adminData.id);
      await updateDoc(adminRef, {
        name: adminName,
        email: adminEmail.toLowerCase(),
        password: adminPassword,
      });
      Alert.alert('Success', 'Admin updated successfully!');
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error updating admin:', error.message);
      Alert.alert('Error', 'Failed to update admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Admin',
      'Are you sure you want to delete this admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(firestore, 'UserData', adminData.id));
              Alert.alert('Success', 'Admin deleted successfully!');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting admin:', error.message);
              Alert.alert('Error', 'Failed to delete admin.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Admin Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name={isEditing ? "close" : "pencil"} size={24} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageSection}>
          <Image
            source={adminData.image ? { uri: adminData.image } : dp}
            style={styles.adminImage}
          />
        </View>

        <View style={styles.formSection}>
          <TextInput
            label="Admin Name"
            value={adminName}
            onChangeText={setAdminName}
            mode="outlined"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            editable={isEditing}
            left={
              <TextInput.Icon
                icon="account-outline"
                size={24}
                style={styles.iconStyle}
              />
            }
          />

          <TextInput
            label="Admin Email"
            value={adminEmail}
            onChangeText={setAdminEmail}
            mode="outlined"
            activeOutlineColor={Colors.PRIMARY}
            outlineColor={Colors.SECONDARY}
            style={styles.inputField}
            editable={isEditing}
            left={
              <TextInput.Icon
                icon="email-outline"
                size={24}
                style={styles.iconStyle}
              />
            }
          />

          <PasswordTextInput
            label="Password"
            value={adminPassword}
            onChangeText={setAdminPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            style={styles.inputField}
            editable={isEditing}
          />

          {isEditing && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.updateButton]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Update Admin</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Delete Admin</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  leftIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginLeft: 5,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  adminImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputField: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  iconStyle: {
    marginTop: 15,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: Colors.PRIMARY,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});