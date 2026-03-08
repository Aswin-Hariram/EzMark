import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import dp from '../../assets/Teachers/profile.png';
import { Colors } from '../../assets/Colors';
import { auth } from '../../Config/FirebaseConfig';
import { getInstitutionData } from '../Admin/institutionData';

const TProfile = ({ teacher1, getTeachers1 }) => {
  const route = useRoute();
  const navigation = useNavigation();
  const { teacher = teacher1, getTeachers = getTeachers1 } = route.params || {};
  const [loadingImage, setLoadingImage] = useState(Boolean(teacher?.image));
  const [institutionData, setInstitutionData] = useState({ classes: [], subjects: [] });

  useEffect(() => {
    const loadInstitution = async () => {
      try {
        const data = await getInstitutionData();
        setInstitutionData(data);
      } catch (error) {
        console.log('Error loading teacher profile context:', error);
      }
    };

    loadInstitution();
  }, []);

  const profileStats = useMemo(() => ({
    classCount: teacher?.classes?.length || 0,
    subjectCount: teacher?.subjects?.length || 0,
    department: teacher?.department || 'Not assigned',
  }), [teacher?.classes?.length, teacher?.department, teacher?.subjects?.length]);

  const handleLogout = () => {
    if (!auth.currentUser) {
      return;
    }

    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          auth.signOut().then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          });
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
          <TouchableOpacity style={styles.editAction} onPress={() => navigation.navigate('TeacherProfile', { teacher, getTeachers })}>
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.profileVisual}>
            {loadingImage ? (
              <View style={styles.lottieShell}>
                <LottieView source={require('../../assets/avatar.json')} autoPlay loop style={styles.avatarLottie} />
              </View>
            ) : null}
            <Image
              style={loadingImage ? styles.hiddenImage : styles.profileImage}
              source={teacher?.image ? { uri: teacher.image } : dp}
              onLoadEnd={() => setLoadingImage(false)}
              onError={() => setLoadingImage(false)}
              defaultSource={dp}
            />
          </View>
          <Text style={styles.teacherName}>{teacher?.name || 'Teacher'}</Text>
          <Text style={styles.teacherMeta}>{teacher?.email}</Text>
          <Text style={styles.teacherDept}>{profileStats.department}</Text>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{profileStats.classCount}</Text>
            <Text style={styles.metricLabel}>Classes</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{profileStats.subjectCount}</Text>
            <Text style={styles.metricLabel}>Subjects</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Assigned Classes</Text>
          <View style={styles.chipWrap}>
            {(teacher?.classes || []).length ? teacher.classes.map((item) => (
              <View key={item} style={styles.primaryChip}>
                <Text style={styles.primaryChipText}>{item}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No classes assigned.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Owned Subjects</Text>
          <View style={styles.chipWrap}>
            {(teacher?.subjects || []).length ? teacher.subjects.map((item) => (
              <View key={item} style={styles.secondaryChip}>
                <Text style={styles.secondaryChipText}>{item}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No subjects assigned.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Institution Snapshot</Text>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Available classes</Text>
            <Text style={styles.snapshotValue}>{institutionData.classes.length}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Available subjects</Text>
            <Text style={styles.snapshotValue}>{institutionData.subjects.length}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  editAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileVisual: {
    width: 132,
    height: 132,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieShell: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
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
  teacherName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teacherMeta: {
    marginTop: 6,
    color: '#D7E1EA',
  },
  teacherDept: {
    marginTop: 6,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  metricLabel: {
    marginTop: 4,
    color: '#738393',
  },
  sectionCard: {
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryChip: {
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryChipText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  secondaryChip: {
    backgroundColor: '#EEF5F0',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryChipText: {
    color: '#286846',
    fontWeight: '700',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  snapshotLabel: {
    color: '#738393',
  },
  snapshotValue: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  emptyText: {
    color: '#738393',
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

export default TProfile;
