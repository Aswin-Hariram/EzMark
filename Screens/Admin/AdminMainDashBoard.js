import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { auth, firestore } from '../../Config/FirebaseConfig';
import { Colors } from '../../assets/Colors';
import { getInstitutionData } from './institutionData';

const actionCards = [
  { label: 'Add Teacher', icon: 'person-add-alt-1', action: 'AddTeacher', type: 'stack' },
  { label: 'Add Student', icon: 'groups', action: 'AddStudent', type: 'stack' },
  { label: 'Create Class', icon: 'class', action: 'AddClass', type: 'stack' },
  { label: 'Open Subjects', icon: 'menu-book', action: 'subjects', type: 'section' },
];

const AdminMainDashBoard = ({ onOpenSection, embedded = false }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminData, setAdminData] = useState({
    users: [],
    classes: [],
    subjects: [],
    recentUsers: [],
  });

  const loadDashboard = useCallback(async () => {
    try {
      const [institution, userSnapshot] = await Promise.all([
        getInstitutionData(),
        getDocs(collection(firestore, 'UserData')),
      ]);

      const users = userSnapshot.docs.map((item) => item.data());
      const recentUsers = [...users].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 6);

      setAdminData({
        users,
        classes: institution.classDetails,
        subjects: institution.subjects,
        recentUsers,
      });
    } catch (error) {
      console.log('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const metrics = useMemo(() => {
    const teachers = adminData.users.filter((item) => item.type === 'Teacher');
    const students = adminData.users.filter((item) => item.type === 'Student');
    const classesMissingAdvisor = adminData.classes.filter((item) => !item.advisor).length;
    const classesWithoutSubjects = adminData.classes.filter((item) => !(item.subjects || []).length).length;
    const teachersWithoutClasses = teachers.filter((item) => !(item.classes || []).length).length;
    const studentsWithoutSubjects = students.filter((item) => !(item.subjects || []).length).length;

    return {
      teachers,
      students,
      totalClasses: adminData.classes.length,
      totalSubjects: adminData.subjects.length,
      classesMissingAdvisor,
      classesWithoutSubjects,
      teachersWithoutClasses,
      studentsWithoutSubjects,
    };
  }, [adminData.classes, adminData.subjects.length, adminData.users]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const teacherHits = metrics.teachers
      .filter((item) => `${item.name} ${item.department} ${(item.classes || []).join(' ')}`.toLowerCase().includes(query))
      .map((item) => ({ key: `teacher-${item.id}`, label: item.name, subtitle: item.department, item, target: 'TeacherProfile' }));
    const studentHits = metrics.students
      .filter((item) => `${item.name} ${item.rollno} ${item.department} ${item.class || ''}`.toLowerCase().includes(query))
      .map((item) => ({ key: `student-${item.id}`, label: item.name, subtitle: `${item.rollno} • ${item.class || 'No class'}`, item, target: 'StudentProfile' }));
    const classHits = adminData.classes
      .filter((item) => `${item.name} ${item.department} ${(item.subjects || []).join(' ')}`.toLowerCase().includes(query))
      .map((item) => ({ key: `class-${item.id}`, label: item.name, subtitle: item.department || 'Department pending', item, target: 'ClassScreen' }));
    const subjectHits = adminData.subjects
      .filter((item) => item.toLowerCase().includes(query))
      .map((item) => ({ key: `subject-${item}`, label: item, subtitle: 'Subject catalog', item, target: 'Subjects' }));

    return [...teacherHits, ...studentHits, ...classHits, ...subjectHits].slice(0, 8);
  }, [adminData.classes, adminData.subjects, metrics.students, metrics.teachers, searchQuery]);

  const insights = useMemo(() => [
    {
      title: 'Classes need advisors',
      value: metrics.classesMissingAdvisor,
      tone: metrics.classesMissingAdvisor ? 'warning' : 'healthy',
      action: 'Classes',
    },
    {
      title: 'Teachers without classes',
      value: metrics.teachersWithoutClasses,
      tone: metrics.teachersWithoutClasses ? 'warning' : 'healthy',
      action: 'Teachers',
    },
    {
      title: 'Students missing subjects',
      value: metrics.studentsWithoutSubjects,
      tone: metrics.studentsWithoutSubjects ? 'warning' : 'healthy',
      action: 'Students',
    },
    {
      title: 'Classes without subjects',
      value: metrics.classesWithoutSubjects,
      tone: metrics.classesWithoutSubjects ? 'warning' : 'healthy',
      action: 'Classes',
    },
  ], [metrics.classesMissingAdvisor, metrics.classesWithoutSubjects, metrics.studentsWithoutSubjects, metrics.teachersWithoutClasses]);

  const topClasses = useMemo(() => {
    return adminData.classes
      .map((classItem) => ({
        ...classItem,
        studentCount: metrics.students.filter((student) => student.class === classItem.name).length,
      }))
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, 4);
  }, [adminData.classes, metrics.students]);

  const navigateFromSearch = (result) => {
    if (result.target === 'Teachers' || result.target === 'Students' || result.target === 'Classes' || result.target === 'Subjects') {
      onOpenSection?.(result.target.toLowerCase());
      return;
    }

    if (result.target === 'TeacherProfile') {
      navigation.navigate('TeacherProfile', { teacher: result.item, getTeachers: loadDashboard });
      return;
    }
    if (result.target === 'StudentProfile') {
      navigation.navigate('StudentProfile', { student: result.item, getStudent: loadDashboard });
      return;
    }
    if (result.target === 'ClassScreen') {
      navigation.navigate('ClassScreen', { classItem: result.item });
      return;
    }
    navigation.navigate(result.target);
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
  };

  const Container = embedded ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, embedded && styles.embeddedContent]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDashboard();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>EzMark Admin</Text>
            <Text style={styles.headerTitle}>Institution Command Center</Text>
          </View>
          {!embedded ? (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialIcons name="logout" size={22} color={Colors.PRIMARY} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Live academic operations</Text>
          <Text style={styles.heroSubtitle}>
            Monitor staffing, class structure, and roster readiness before attendance workflows begin.
          </Text>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{metrics.totalClasses}</Text>
              <Text style={styles.heroMetricLabel}>Classes</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{metrics.totalSubjects}</Text>
              <Text style={styles.heroMetricLabel}>Subjects</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{metrics.teachers.length}</Text>
              <Text style={styles.heroMetricLabel}>Teachers</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{metrics.students.length}</Text>
              <Text style={styles.heroMetricLabel}>Students</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={Colors.SECONDARY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teachers, students, classes, subjects"
              placeholderTextColor="#728292"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          {searchResults.length ? (
            <View style={styles.searchResults}>
              {searchResults.map((result) => (
                <TouchableOpacity key={result.key} style={styles.searchResultRow} onPress={() => navigateFromSearch(result)}>
                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultTitle}>{result.label}</Text>
                    <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.PRIMARY} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionGrid}>
          {actionCards.map((action) => (
              <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => {
                if (action.type === 'section') {
                  onOpenSection?.(action.action);
                  return;
                }

                navigation.navigate(action.action);
              }}
            >
              <MaterialIcons name={action.icon} size={24} color={Colors.PRIMARY} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Readiness Insights</Text>
        </View>
        <View style={styles.insightGrid}>
          {insights.map((insight) => (
            <TouchableOpacity
              key={insight.title}
              style={styles.insightCard}
              onPress={() => onOpenSection?.(insight.action.toLowerCase())}
            >
              <Text style={styles.insightValue}>{insight.value}</Text>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={insight.tone === 'warning' ? styles.insightToneWarning : styles.insightToneHealthy}>
                {insight.tone === 'warning' ? 'Needs attention' : 'Healthy'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Classes</Text>
          <TouchableOpacity onPress={() => onOpenSection?.('classes')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.panel}>
          {topClasses.length ? topClasses.map((classItem) => (
            <TouchableOpacity
              key={classItem.id || classItem.name}
              style={styles.panelRow}
              onPress={() => navigation.navigate('ClassScreen', { classItem })}
            >
              <View style={styles.panelCopy}>
                <Text style={styles.panelTitle}>{classItem.name}</Text>
                <Text style={styles.panelSubtitle}>
                  {classItem.department || 'Department pending'} • {classItem.studentCount} students
                </Text>
              </View>
              <View style={styles.panelBadge}>
                <Text style={styles.panelBadgeText}>{(classItem.subjects || []).length} subjects</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyText}>No classes available yet.</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Profiles</Text>
        </View>
        <View style={styles.panel}>
          {adminData.recentUsers.length ? adminData.recentUsers.map((item, index) => (
            <View key={item.id ?? item.email ?? index} style={styles.panelRow}>
              <View style={styles.panelCopy}>
                <Text style={styles.panelTitle}>{item.name}</Text>
                <Text style={styles.panelSubtitle}>
                  {item.type} • {item.class || item.department || item.email}
                </Text>
              </View>
              <Text style={styles.recentType}>{item.type}</Text>
            </View>
          )) : (
            <Text style={styles.emptyText}>{loading ? 'Loading profiles...' : 'No recent profiles found.'}</Text>
          )}
        </View>
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  embeddedContent: {
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerEyebrow: {
    color: '#6B7C8D',
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  logoutButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#D9E3ED',
    lineHeight: 20,
    marginBottom: 18,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  heroMetricCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    padding: 14,
  },
  heroMetricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroMetricLabel: {
    color: '#D8E2EC',
    marginTop: 4,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.PRIMARY,
  },
  searchResults: {
    marginTop: 12,
    gap: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  searchResultCopy: {
    flex: 1,
    marginRight: 8,
  },
  searchResultTitle: {
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  searchResultSubtitle: {
    marginTop: 4,
    color: '#708191',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  sectionLink: {
    color: Colors.SECONDARY,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
  },
  actionLabel: {
    marginTop: 14,
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  insightCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  insightTitle: {
    marginTop: 8,
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  insightToneHealthy: {
    marginTop: 10,
    color: '#217A49',
    fontWeight: '700',
  },
  insightToneWarning: {
    marginTop: 10,
    color: '#B06C00',
    fontWeight: '700',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  panelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  panelCopy: {
    flex: 1,
    marginRight: 10,
  },
  panelTitle: {
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  panelSubtitle: {
    marginTop: 4,
    color: '#708191',
  },
  panelBadge: {
    backgroundColor: '#ECF2F7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  panelBadgeText: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  recentType: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyText: {
    paddingVertical: 18,
    color: '#748595',
  },
});

export default AdminMainDashBoard;
