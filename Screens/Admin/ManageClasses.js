import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';
import { getInstitutionData } from './institutionData';

const filterOptions = ['All', 'Missing Advisor', 'Over Capacity', 'No Students'];
const sortOptions = ['Name', 'Students', 'Teachers'];

const ManageClasses = ({ embedded = false }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Name');
  const [activeFilter, setActiveFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classRecords, setClassRecords] = useState([]);

  const loadClasses = useCallback(async () => {
    try {
      const [institution, userSnapshot] = await Promise.all([
        getInstitutionData(),
        getDocs(collection(firestore, 'UserData')),
      ]);

      const users = userSnapshot.docs.map((item) => item.data());
      const students = users.filter((item) => item.type === 'Student');
      const teachers = users.filter((item) => item.type === 'Teacher');

      const records = institution.classDetails.map((classItem) => {
        const linkedTeachers = teachers.filter((teacher) => (teacher.classes || []).includes(classItem.name));
        const linkedStudents = students.filter((student) => student.class === classItem.name);
        const occupancy = classItem.capacity ? Math.round((linkedStudents.length / classItem.capacity) * 100) : 0;

        return {
          ...classItem,
          teacherCount: linkedTeachers.length,
          studentCount: linkedStudents.length,
          subjectCount: (classItem.subjects || []).length,
          occupancy,
          hasAdvisor: Boolean(classItem.advisor),
        };
      });

      setClassRecords(records);
    } catch (error) {
      console.log('Error fetching classes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses])
  );

  const summary = useMemo(() => ({
    total: classRecords.length,
    missingAdvisor: classRecords.filter((item) => !item.hasAdvisor).length,
    overCapacity: classRecords.filter((item) => item.capacity && item.studentCount > item.capacity).length,
    activeStudents: classRecords.reduce((sum, item) => sum + item.studentCount, 0),
  }), [classRecords]);

  const filteredClasses = useMemo(() => {
    let data = classRecords.filter((item) => {
      const haystack = [
        item.name,
        item.department,
        item.advisor,
        ...(item.subjects || []),
        ...(item.teachers || []),
      ].join(' ').toLowerCase();

      return haystack.includes(searchQuery.trim().toLowerCase());
    });

    if (activeFilter === 'Missing Advisor') {
      data = data.filter((item) => !item.hasAdvisor);
    }
    if (activeFilter === 'Over Capacity') {
      data = data.filter((item) => item.capacity && item.studentCount > item.capacity);
    }
    if (activeFilter === 'No Students') {
      data = data.filter((item) => item.studentCount === 0);
    }

    return [...data].sort((a, b) => {
      if (sortOption === 'Students') {
        return b.studentCount - a.studentCount;
      }
      if (sortOption === 'Teachers') {
        return b.teacherCount - a.teacherCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [activeFilter, classRecords, searchQuery, sortOption]);

  const Container = embedded ? View : SafeAreaView;

  const renderHeader = () => (
    <View>
      <View style={[styles.hero, embedded && styles.embeddedHero]}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Class Operations</Text>
          <Text style={styles.heroSubtitle}>
            Track staffing, subject coverage, and class readiness from one control surface.
          </Text>
        </View>
        <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AddClass')}>
          <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.quickActionText}>New Class</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.total}</Text>
          <Text style={styles.metricLabel}>Classes</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.activeStudents}</Text>
          <Text style={styles.metricLabel}>Students</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{summary.missingAdvisor}</Text>
          <Text style={styles.metricLabel}>Need Advisor</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.SECONDARY} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search class, teacher, department, subject"
          placeholderTextColor="#6F8090"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        horizontal
        data={filterOptions}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterListContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={item === activeFilter ? styles.filterChipActive : styles.filterChip}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={item === activeFilter ? styles.filterChipTextActive : styles.filterChipText}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        horizontal
        data={sortOptions}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.sortList}
        contentContainerStyle={styles.filterListContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={item === sortOption ? styles.sortChipActive : styles.sortChip}
            onPress={() => setSortOption(item)}
          >
            <Text style={item === sortOption ? styles.sortChipTextActive : styles.sortChipText}>
              Sort: {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  return (
    <Container style={styles.container}>
      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id || item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.classCard}
            onPress={() => navigation.navigate('ClassScreen', { classItem: item })}
          >
            <View style={styles.classHeader}>
              <View style={styles.classTitleWrap}>
                <Text style={styles.className}>{item.name}</Text>
                <Text style={styles.classMeta}>{item.department || 'Department pending'}</Text>
              </View>
              <View style={item.hasAdvisor ? styles.statusBadge : styles.statusBadgeWarning}>
                <Text style={item.hasAdvisor ? styles.statusText : styles.statusTextWarning}>
                  {item.hasAdvisor ? 'Ready' : 'Setup Pending'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{item.studentCount}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{item.teacherCount}</Text>
                <Text style={styles.statLabel}>Teachers</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{item.subjectCount}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Advisor: {item.advisor || 'Unassigned'}</Text>
              <Text style={styles.detailText}>
                Capacity: {item.capacity ? `${item.studentCount}/${item.capacity}` : `${item.studentCount}`}
              </Text>
            </View>

            <View style={styles.subjectsWrap}>
              {(item.subjects || []).length ? item.subjects.slice(0, 4).map((subject) => (
                <View key={subject} style={styles.subjectChip}>
                  <Text style={styles.subjectChipText}>{subject}</Text>
                </View>
              )) : (
                <Text style={styles.emptySubjectsText}>No subjects mapped</Text>
              )}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.occupancyText}>
                {item.capacity ? `Occupancy ${item.occupancy}%` : 'Capacity not set'}
              </Text>
              <Entypo name="chevron-right" size={20} color={Colors.PRIMARY} />
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No classes found</Text>
              <Text style={styles.emptySubtitle}>Create the first class to start organizing the institution.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadClasses();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddClass')}>
        <Entypo name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  hero: {
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 28,
    backgroundColor: Colors.PRIMARY,
  },
  embeddedHero: {
    marginTop: 0,
  },
  heroCopy: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#D8E2EC',
    lineHeight: 20,
  },
  quickAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.SECONDARY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  metricLabel: {
    color: '#607181',
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.PRIMARY,
  },
  filterList: {
    marginBottom: 10,
  },
  sortList: {
    marginBottom: 14,
  },
  filterListContent: {
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8E2EC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.PRIMARY,
  },
  filterChipText: {
    color: '#4D6678',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EAF0F5',
  },
  sortChipActive: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.SECONDARY,
  },
  sortChipText: {
    color: '#456072',
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  classTitleWrap: {
    flex: 1,
  },
  className: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  classMeta: {
    color: '#6B7C8D',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#E2F2E8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeWarning: {
    backgroundColor: '#FFF3D8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#1C7C46',
    fontWeight: '700',
    fontSize: 12,
  },
  statusTextWarning: {
    color: '#AA6A00',
    fontWeight: '700',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  statBlock: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    borderRadius: 18,
    padding: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  statLabel: {
    color: '#6E7E8E',
    marginTop: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    flex: 1,
    color: '#516879',
  },
  subjectsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 34,
  },
  subjectChip: {
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subjectChipText: {
    color: '#365163',
    fontWeight: '600',
    fontSize: 12,
  },
  emptySubjectsText: {
    color: '#6F8190',
  },
  cardFooter: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occupancyText: {
    color: Colors.SECONDARY,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.PRIMARY,
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7C8D',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.PRIMARY,
  },
});

export default ManageClasses;
