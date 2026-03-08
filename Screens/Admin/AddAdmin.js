import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../assets/Colors';
import PasswordTextInput from '../../Components/PasswordTextInput';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from '@firebase/auth';
import { firestore, auth } from '../../Config/FirebaseConfig';

const AddAdmin = () => {
    const navigation = useNavigation();
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const handleSaveAdmin = async () => {
        if (validateInput()) {
            setProcessing(true);

            const newAdmin = {
                id: Date.now().toString(),
                name: adminName,
                email: adminEmail.toLowerCase(),
                password: adminPassword,
                type: 'Admin'
            };

            try {
                await setDoc(doc(firestore, 'UserData', newAdmin.id), newAdmin);
                await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
                Alert.alert('Success', 'Admin added successfully!');
                navigation.goBack();
            } catch (error) {
                console.error('Error saving admin:', error.message);
                Alert.alert('Error', 'Failed to add admin.');
            } finally {
                setProcessing(false);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
                        <Text style={styles.backText}>Add Admin</Text>
                    </TouchableOpacity>
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
                        left={
                            <TextInput.Icon
                                icon="account-outline"
                                size={24}
                                style={styles.iconStyle}
                            />
                        }
                        right={
                            adminName.length > 0 && (
                                <TextInput.Icon
                                    icon="close-circle"
                                    size={24}
                                    style={styles.iconStyle}
                                    onPress={() => setAdminName('')}
                                />
                            )
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
                        left={
                            <TextInput.Icon
                                icon="email-outline"
                                size={24}
                                style={styles.iconStyle}
                            />
                        }
                        right={
                            adminEmail.length > 0 && (
                                <TextInput.Icon
                                    icon="close-circle"
                                    size={24}
                                    style={styles.iconStyle}
                                    onPress={() => setAdminEmail('')}
                                />
                            )
                        }
                    />

                    <PasswordTextInput
                        label="Password"
                        value={adminPassword}
                        onChangeText={setAdminPassword}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        style={styles.inputField}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, processing && styles.disabledButton]}
                        onPress={handleSaveAdmin}
                        disabled={processing}
                    >
                        {processing ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Add Admin</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddAdmin;

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
    formSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    inputField: {
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    iconStyle: {
        marginTop: 15,
    },
    saveButton: {
        backgroundColor: Colors.PRIMARY,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
