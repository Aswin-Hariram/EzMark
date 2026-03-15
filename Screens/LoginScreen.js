import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors } from '../assets/Colors';
import { auth, firestore } from '../Config/FirebaseConfig';
import { signInWithEmailAndPassword } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';

const roleOptions = [
  { id: '1', label: 'Student', value: 'Student', icon: 'account-school-outline' },
  { id: '2', label: 'Teacher', value: 'Teacher', icon: 'account-tie-outline' },
  { id: '3', label: 'Admin', value: 'Admin', icon: 'shield-account-outline' },
];

const platformSignals = [
  { label: 'Role-aware routing', value: 'Automatic', icon: 'source-branch' },
  { label: 'Access verification', value: 'Realtime', icon: 'shield-check-outline' },
  { label: 'Institution session', value: 'Secure', icon: 'lock-outline' },
];

const LoginScreen = ({ navigation }) => {
  const [selectedId, setSelectedId] = useState('1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();

  const isWide = width >= 920;
  const selectedRole = roleOptions.find((role) => role.id === selectedId) ?? roleOptions[0];

  const validateInput = (emailValue, passwordValue) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/;

    if (!emailRegex.test(emailValue)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    if (!passwordRegex.test(passwordValue)) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 5 characters, 1 uppercase letter, 1 lowercase letter, and 1 number.'
      );
      return false;
    }

    return true;
  };

  const checkAdminAccess = async (emailValue, type, passwordValue) => {
    try {
      const q = query(collection(firestore, 'UserData'), where('email', '==', emailValue));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        if (doc.data().type === type) {
          await AsyncStorage.setItem('userType', type);
          await signInWithEmailAndPassword(auth, emailValue, passwordValue);

          if (type === 'Admin') navigation.replace('AdminDashboardScreen');
          else if (type === 'Teacher') navigation.replace('TeacherDashBoard');
          else navigation.replace('StudentDashBoard');

          return;
        }
      }

      Alert.alert('Access Denied', 'You do not have the required permissions.');
    } catch (error) {
      console.log(error);
      Alert.alert('Invalid Credentials', 'Please enter correct credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!validateInput(email, password)) return;

    setLoading(true);

    try {
      await checkAdminAccess(email.toLowerCase(), selectedRole.value, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.backgroundGrid} />
          <View style={styles.backgroundAccentTop} />
          <View style={styles.backgroundAccentBottom} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={[styles.shell, isWide && styles.shellWide]}>
              {/* <View style={[styles.infoPanel, isWide && styles.infoPanelWide]}>
                <View style={styles.brandBlock}>
                  <View style={styles.brandMark}>
                    <MaterialCommunityIcons name="office-building-cog-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.brandName}>EZMARK</Text>
                    <Text style={styles.brandSubline}>Enterprise Attendance Platform</Text>
                  </View>
                </View>

                <View style={styles.heroContent}>
                  <Text style={styles.eyebrow}>Institution Access</Text>
                  <Text style={styles.heroTitle}>Unified sign-in for academic operations.</Text>
                  <Text style={styles.heroSubtitle}>
                    Authenticate once and continue into the correct workspace for attendance, verification, and administration.
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Platform controls</Text>
                  {platformSignals.map((item) => (
                    <View key={item.label} style={styles.summaryRow}>
                      <View style={styles.summaryRowLeft}>
                        <View style={styles.summaryIconWrap}>
                          <MaterialCommunityIcons name={item.icon} size={18} color={Colors.PRIMARY} />
                        </View>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                      </View>
                      <Text style={styles.summaryValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Session profile</Text>
                  <Text style={styles.noticeText}>
                    Access is validated against the institution directory before dashboard routing.
                  </Text>
                  <View style={styles.noticeStatus}>
                    <View style={styles.noticeDot} />
                    <Text style={styles.noticeStatusText}>Directory validation enabled</Text>
                  </View>
                </View>
              </View> */}

              <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
                <View style={styles.formHeader}>
                  <Text style={styles.formEyebrow}>Secure Login</Text>
                  <Text style={styles.formTitle}>Sign in to continue</Text>
                  <Text style={styles.formSubtitle}>
                    Choose the correct role and use your official institution credentials.
                  </Text>
                </View>

                <View style={styles.roleSection}>
                  <Text style={styles.sectionLabel}>Access Role</Text>
                  <View style={styles.roleGrid}>
                    {roleOptions.map((role) => {
                      const isActive = role.id === selectedId;

                      return (
                        <Pressable
                          key={role.id}
                          onPress={() => setSelectedId(role.id)}
                          style={[styles.roleCard, isActive && styles.roleCardActive]}
                        >
                          <View style={[styles.roleIcon, isActive && styles.roleIconActive]}>
                            <MaterialCommunityIcons
                              name={role.icon}
                              size={18}
                              color={isActive ? '#FFFFFF' : Colors.PRIMARY}
                            />
                          </View>
                          <Text style={[styles.roleLabel, isActive && styles.roleLabelActive]}>
                            {role.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Email address</Text>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    placeholder="name@institution.edu"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    activeOutlineColor={Colors.PRIMARY}
                    outlineColor="#D6E0E7"
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="email-outline" color="#6A7E8D" />}
                    right={
                      email.length > 0 ? (
                        <TextInput.Icon
                          icon="close-circle"
                          color="#6A7E8D"
                          onPress={() => setEmail('')}
                        />
                      ) : null
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <View style={styles.passwordHeader}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <Text style={styles.passwordHint}>Case-sensitive</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    mode="outlined"
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    activeOutlineColor={Colors.PRIMARY}
                    outlineColor="#D6E0E7"
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    left={<TextInput.Icon icon="lock-outline" color="#6A7E8D" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        color="#6A7E8D"
                        onPress={() => setShowPassword((current) => !current)}
                      />
                    }
                  />
                </View>

                <View style={styles.contextStrip}>
                  <View style={styles.contextStripIcon}>
                    <MaterialCommunityIcons name={selectedRole.icon} size={18} color={Colors.PRIMARY} />
                  </View>
                  <View style={styles.contextStripText}>
                    <Text style={styles.contextStripTitle}>{selectedRole.value} workspace selected</Text>
                    <Text style={styles.contextStripSubtitle}>
                      You will be redirected to the appropriate dashboard after sign-in.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.92}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.loginButtonContent}>
                      <Text style={styles.loginButtonText}>Access Platform</Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.footerNote}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#6C818F" />
                  <Text style={styles.footerNoteText}>
                    Need access support? Contact your institution administrator.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  safeArea: {
    flex: 1,
  },
  backgroundGrid: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#F3F6F8',
  },
  backgroundAccentTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(21, 52, 72, 0.06)',
  },
  backgroundAccentBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(60, 91, 111, 0.08)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  shell: {
    gap: 18,
  },
  shellWide: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1180,
    alignItems: 'stretch',
  },
  infoPanel: {
    backgroundColor: '#173548',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#102230',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 7,
  },
  infoPanelWide: {
    flex: 1.05,
    minHeight: 700,
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 18,
    letterSpacing: 1.4,
    fontFamily: 'Signika',
  },
  brandSubline: {
    color: '#AFC2CE',
    fontSize: 12,
    fontFamily: 'Metro',
  },
  heroContent: {
    marginBottom: 26,
  },
  eyebrow: {
    color: '#9EB4C2',
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: 'Metro',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 33,
    lineHeight: 40,
    fontFamily: 'Signika',
    marginBottom: 12,
    maxWidth: 480,
  },
  heroSubtitle: {
    color: '#C7D4DC',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Metro',
    maxWidth: 520,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 18,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Signika',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E7EEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    color: '#E6EDF2',
    fontSize: 14,
    fontFamily: 'Metro',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Signika',
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
  },
  noticeTitle: {
    color: '#173548',
    fontSize: 16,
    fontFamily: 'Signika',
    marginBottom: 8,
  },
  noticeText: {
    color: '#557081',
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Metro',
    marginBottom: 14,
  },
  noticeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2BA36A',
  },
  noticeStatusText: {
    color: '#173548',
    fontSize: 13,
    fontFamily: 'Metro',
  },
  formPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 25,
    borderWidth: 1,
    borderColor: '#E3EBF0',
    shadowColor: '#142634',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  formPanelWide: {
    flex: 0.92,
    minHeight: 700,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  formHeader: {
    marginBottom: 24,
  },
  formEyebrow: {
    color: '#6A7E8D',
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontFamily: 'Metro',
    marginBottom: 10,
  },
  formTitle: {
    color: '#152F40',
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'Signika',
    marginBottom: 8,
  },
  formSubtitle: {
    color: '#627786',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Metro',
  },
  roleSection: {
    marginBottom: 22,
  },
  sectionLabel: {
    color: '#415B6B',
    fontSize: 13,
    fontFamily: 'Metro',
    marginBottom: 10,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE6EC',
    backgroundColor: '#F8FBFC',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  roleCardActive: {
    backgroundColor: '#EAF1F5',
    borderColor: Colors.PRIMARY,
  },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E6EEF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconActive: {
    backgroundColor: Colors.PRIMARY,
  },
  roleLabel: {
    color: '#355062',
    fontSize: 13,
    fontFamily: 'Metro',
  },
  roleLabelActive: {
    color: '#173548',
    fontFamily: 'Signika',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#415B6B',
    fontSize: 13,
    fontFamily: 'Metro',
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  passwordHint: {
    color: '#8394A0',
    fontSize: 11,
    fontFamily: 'Metro',
  },
  textInput: {
    backgroundColor: '#FCFDFE',
    fontSize: 15,
  },
  inputOutline: {
    borderRadius: 18,
  },
  inputContent: {
    paddingVertical: 14,
    fontFamily: 'Metro',
  },
  contextStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    borderWidth: 1,
    borderColor: '#E1EAF0',
    padding: 16,
    marginTop: 6,
    marginBottom: 22,
  },
  contextStripIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7EEF2',
  },
  contextStripText: {
    flex: 1,
  },
  contextStripTitle: {
    color: '#173548',
    fontSize: 15,
    fontFamily: 'Signika',
    marginBottom: 4,
  },
  contextStripSubtitle: {
    color: '#627786',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Metro',
  },
  loginButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.8,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Signika',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  footerNoteText: {
    color: '#6C818F',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: 'Metro',
  },
});
