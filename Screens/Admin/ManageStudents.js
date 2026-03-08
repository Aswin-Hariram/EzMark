import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';

const sortOptions = ['Name', 'Department', 'Class'];

const ManageStudents = ({ embedded = false }) => {
  const navigation = useNavigation();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Name');

  const getStudents = useCallback(async () => {
    try {
      const studentQuery = query(collection(firestore, 'UserData'), where('type', '==', 'Student'));
      const querySnapshot = await getDocs(studentQuery);
      const records = querySnapshot.docs.map((item) => item.data());
      setStudents(records);
    } catch (error) {
      console.log('Error getting students:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getStudents();
    }, [getStudents])
  );

  const summary = useMemo(() => ({
    total: students.length,
    activeClasses: new Set(students.map((item) => item.class).filter(Boolean)).size,
    fullyMapped: students.filter((item) => item.class && (item.subjects || []).length).length,
  }), [students]);

  const filteredStudents = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    const matches = students.filter((student) =>
      `${student.name} ${student.department} ${student.rollno} ${student.class || ''} ${(student.subjects || []).join(' ')}`
        .toLowerCase()
        .includes(queryText)
    );

    return [...matches].sort((a, b) => {
      if (sortOption === 'Department') {
        return (a.department || '').localeCompare(b.department || '');
      }
      if (sortOption === 'Class') {
        return (a.class || '').localeCompare(b.class || '');
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [searchQuery, sortOption, students]);

  const Container = embedded ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id || item.email}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.studentCard}
            onPress={() => navigation.navigate('StudentProfile', { student: item, getStudent: getStudents })}
          >
            <View style={styles.studentCopy}>
              <Text style={styles.studentName}>{item.name}</Text>
              <Text style={styles.studentMeta}>
                {item.rollno} • {item.class || 'Class pending'}
              </Text>
              <View style={styles.studentStats}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{item.department || 'Department pending'}</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{(item.subjects || []).length} subjects</Text>
                </View>
              </View>
            </View>
            <Entypo name="chevron-right" size={20} color={Colors.PRIMARY} />
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <View>
            <View style={[styles.hero, embedded && styles.embeddedHero]}>
              <Text style={styles.heroTitle}>Student Management</Text>
              <Text style={styles.heroSubtitle}>
                Review student allocation, subject enrollment, and class assignment readiness.
              </Text>
              <TouchableOpacity style={styles.inlineAction} onPress={() => navigation.navigate('AddStudent', { getStudents })}>
                <MaterialIcons name="person-add-alt" size={22} color="#fff" />
                <Text style={styles.inlineActionText}>Add Student</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.total}</Text>
                <Text style={styles.metricLabel}>Students</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.activeClasses}</Text>
                <Text style={styles.metricLabel}>Active Classes</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.fullyMapped}</Text>
                <Text style={styles.metricLabel}>Fully Mapped</Text>
              </View>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={Colors.SECONDARY} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search student, roll no, class, subject"
                placeholderTextColor="#708191"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              horizontal
              data={sortOptions}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortList}
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
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptySubtitle}>Add students to start class and subject allocation.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              getStudents();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddStudent', { getStudents })}>
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  hero: {
    marginTop: 12,
    marginBottom: 16,
    padding: 20,
    borderRadius: 28,
    backgroundColor: Colors.SECONDARY,
  },
  embeddedHero: {
    marginTop: 0,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#DDE7EF',
    lineHeight: 20,
    marginBottom: 14,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inlineActionText: {
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
  sortList: {
    gap: 8,
    marginBottom: 14,
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
    backgroundColor: Colors.PRIMARY,
  },
  sortChipText: {
    color: '#456072',
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  studentCopy: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  studentMeta: {
    color: '#6E7E8E',
    marginTop: 4,
  },
  studentStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statPill: {
    borderRadius: 999,
    backgroundColor: '#EAF0F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statPillText: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
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
    backgroundColor: Colors.SECONDARY,
  },
});

export default ManageStudents;
