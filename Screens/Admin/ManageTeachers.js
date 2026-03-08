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

const sortOptions = ['Name', 'Department', 'Classes'];

const ManageTeachers = ({ embedded = false }) => {
  const navigation = useNavigation();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Name');

  const getTeachers = useCallback(async () => {
    try {
      const teacherQuery = query(collection(firestore, 'UserData'), where('type', '==', 'Teacher'));
      const querySnapshot = await getDocs(teacherQuery);
      const records = querySnapshot.docs.map((item) => item.data());
      setTeachers(records);
    } catch (error) {
      console.log('Error getting teachers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      getTeachers();
    }, [getTeachers])
  );

  const summary = useMemo(() => ({
    total: teachers.length,
    activeDepartments: new Set(teachers.map((item) => item.department).filter(Boolean)).size,
    fullyAssigned: teachers.filter((item) => (item.classes || []).length && (item.subjects || []).length).length,
  }), [teachers]);

  const filteredTeachers = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    const matches = teachers.filter((teacher) =>
      `${teacher.name} ${teacher.department} ${(teacher.classes || []).join(' ')} ${(teacher.subjects || []).join(' ')}`
        .toLowerCase()
        .includes(queryText)
    );

    return [...matches].sort((a, b) => {
      if (sortOption === 'Department') {
        return (a.department || '').localeCompare(b.department || '');
      }
      if (sortOption === 'Classes') {
        return (b.classes || []).length - (a.classes || []).length;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [searchQuery, sortOption, teachers]);

  const Container = embedded ? View : SafeAreaView;

  return (
    <Container style={styles.container}>
      <FlatList
        data={filteredTeachers}
        keyExtractor={(item) => item.id || item.email}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.teacherCard}
            onPress={() => navigation.navigate('TeacherProfile', { teacher: item, getTeachers })}
          >
            <View style={styles.teacherCopy}>
              <Text style={styles.teacherName}>{item.name}</Text>
              <Text style={styles.teacherMeta}>{item.department || 'Department pending'}</Text>
              <View style={styles.teacherStats}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>{(item.classes || []).length} classes</Text>
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
              <Text style={styles.heroTitle}>Teacher Management</Text>
              <Text style={styles.heroSubtitle}>
                Track ownership, teaching coverage, and profile completeness across your faculty.
              </Text>
              <TouchableOpacity style={styles.inlineAction} onPress={() => navigation.navigate('AddTeacher', { getTeachers })}>
                <MaterialIcons name="person-add-alt-1" size={22} color="#fff" />
                <Text style={styles.inlineActionText}>Add Teacher</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.total}</Text>
                <Text style={styles.metricLabel}>Teachers</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.activeDepartments}</Text>
                <Text style={styles.metricLabel}>Departments</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{summary.fullyAssigned}</Text>
                <Text style={styles.metricLabel}>Fully Mapped</Text>
              </View>
            </View>

            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={Colors.SECONDARY} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search teacher, department, subject, class"
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
              <Text style={styles.emptyTitle}>No teachers found</Text>
              <Text style={styles.emptySubtitle}>Add faculty profiles to start assignment management.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              getTeachers();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.floatingButton} onPress={() => navigation.navigate('AddTeacher', { getTeachers })}>
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
    backgroundColor: Colors.PRIMARY,
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
    color: '#D9E3ED',
    lineHeight: 20,
    marginBottom: 14,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.SECONDARY,
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
  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teacherCopy: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.PRIMARY,
  },
  teacherMeta: {
    color: '#6E7E8E',
    marginTop: 4,
  },
  teacherStats: {
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
    backgroundColor: Colors.PRIMARY,
  },
});

export default ManageTeachers;
