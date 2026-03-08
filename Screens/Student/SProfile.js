import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator, TextInput } from 'react-native-paper';
import dp from '../../assets/Teachers/profile.png';
import { Colors } from '../../assets/Colors';
import { auth } from '../../Config/FirebaseConfig';

const SProfile = ({ student }) => {
  const navigation = useNavigation();
  const [loadingImage, setLoadingImage] = useState(Boolean(student?.image));
  const [loggingOut, setLoggingOut] = useState(false);

  const studentStats = useMemo(() => ({
    subjectCount: student?.subjects?.length || 0,
    className: student?.class || 'Class pending',
    department: student?.department || 'Department pending',
  }), [student?.class, student?.department, student?.subjects?.length]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            setLoggingOut(true);
            await auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.PRIMARY} />
            <Text style={styles.backText}>Profile</Text>
          </TouchableOpacity>
          <View style={styles.headerIcon}>
            <MaterialIcons name="verified-user" size={20} color={Colors.PRIMARY} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatarShell}>
            {loadingImage ? (
              <View style={styles.avatarLoader}>
                <LottieView source={require('../../assets/avatar.json')} autoPlay loop style={styles.avatarLottie} />
              </View>
            ) : null}
            <Image
              style={loadingImage ? styles.hiddenImage : styles.profileImage}
              source={student?.image ? { uri: student.image } : dp}
              onLoadEnd={() => setLoadingImage(false)}
              onError={() => setLoadingImage(false)}
              defaultSource={dp}
            />
          </View>
          <Text style={styles.studentName}>{student?.name || 'Student'}</Text>
          <Text style={styles.studentMeta}>{student?.email}</Text>
          <Text style={styles.studentMetaSecondary}>{studentStats.className} • {student?.rollno}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Department</Text>
            <Text style={styles.statValue}>{studentStats.department}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Subjects</Text>
            <Text style={styles.statValue}>{studentStats.subjectCount}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TextInput label="Name" value={student?.name || ''} mode="outlined" style={styles.input} editable={false} />
          <TextInput label="Email" value={student?.email || ''} mode="outlined" style={styles.input} editable={false} />
          <TextInput label="Roll No" value={student?.rollno || ''} mode="outlined" style={styles.input} editable={false} />
          <TextInput label="Department" value={studentStats.department} mode="outlined" style={styles.input} editable={false} />
          <TextInput label="Class" value={studentStats.className} mode="outlined" style={styles.input} editable={false} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Enrolled Subjects</Text>
          <View style={styles.subjectWrap}>
            {(student?.subjects || []).length ? student.subjects.map((subject) => (
              <View key={subject} style={styles.subjectChip}>
                <Text style={styles.subjectChipText}>{subject}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No subjects assigned yet.</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.logoutButtonText}>Logout</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4F8',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#102B3C',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarShell: {
    width: 132,
    height: 132,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLoader: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarLottie: {
    width: 132,
    height: 132,
  },
  hiddenImage: {
    width: 0,
    height: 0,
  },
  profileImage: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  studentMeta: {
    color: '#D8E2EC',
    marginTop: 6,
  },
  studentMetaSecondary: {
    color: '#AFC2D0',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  statLabel: {
    color: '#738393',
    fontWeight: '600',
  },
  statValue: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  subjectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  subjectChipText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  emptyText: {
    color: '#758594',
  },
  logoutButton: {
    backgroundColor: '#C74646',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SProfile;
