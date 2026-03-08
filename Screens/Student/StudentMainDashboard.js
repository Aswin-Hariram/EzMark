import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import CPB from '../../Components/CPB';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';

const StudentMainDashboard = ({ studentDetail }) => {
  const navigation = useNavigation();
  const [subjectSummaries, setSubjectSummaries] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('overall');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStudentOverview = async () => {
    try {
      setLoading(true);

      if (!studentDetail?.id) {
        setSubjectSummaries([]);
        setRequests([]);
        return;
      }

      const studentRef = doc(firestore, 'UserData', studentDetail.id);
      const studentSnap = await getDoc(studentRef);
      const studentData = studentSnap.exists() ? studentSnap.data() : studentDetail;
      const subjects = studentData.subjects || [];

      const attendanceQuery = query(
        collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const requestItems = attendanceSnapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      requestItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRequests(requestItems);

      const summaries = await Promise.all(
        subjects.map(async (subject, index) => {
          const subjectQuery = query(
            collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
            where('subjectName', '==', subject)
          );
          const subjectSnapshot = await getDocs(subjectQuery);
          const total = subjectSnapshot.size;
          let attended = 0;
          let pending = 0;

          subjectSnapshot.forEach((entry) => {
            const data = entry.data();
            if (data.status === 'Completed') {
              attended += 1;
            }
            if (data.status === 'Requested') {
              pending += 1;
            }
          });

          return {
            id: `${subject}-${index}`,
            subject,
            total,
            attended,
            pending,
            percentage: total ? Math.round((attended / total) * 100) : 0,
          };
        })
      );

      setSubjectSummaries(summaries);
    } catch (error) {
      console.log('Error fetching student overview:', error);
      setSubjectSummaries([]);
      setRequests([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentOverview();
  }, [studentDetail?.id]);

  const dashboardData = useMemo(() => {
    const pendingRequests = requests.filter((item) => item.status === 'Requested');
    const completedRequests = requests.filter((item) => item.status === 'Completed');
    const averageAttendance = subjectSummaries.length
      ? Math.round(subjectSummaries.reduce((sum, item) => sum + item.percentage, 0) / subjectSummaries.length)
      : 0;
    const strongestSubject = [...subjectSummaries].sort((a, b) => b.percentage - a.percentage)[0] || null;
    const attentionSubject = [...subjectSummaries].sort((a, b) => a.percentage - b.percentage)[0] || null;

    return {
      pendingRequests,
      completedRequests,
      averageAttendance,
      strongestSubject,
      attentionSubject,
      recentRequests: requests.slice(0, 4),
    };
  }, [requests, subjectSummaries]);

  const subjectSelectorData = useMemo(() => {
    const completedTotal = subjectSummaries.reduce((sum, item) => sum + item.attended, 0);
    const sessionTotal = subjectSummaries.reduce((sum, item) => sum + item.total, 0);
    const pendingTotal = subjectSummaries.reduce((sum, item) => sum + item.pending, 0);
    const overallPercentage = sessionTotal ? Number(((completedTotal / sessionTotal) * 100).toFixed(1)) : 0;

    return [
      {
        id: 'overall',
        subject: 'Overall',
        attended: completedTotal,
        total: sessionTotal,
        pending: pendingTotal,
        percentage: overallPercentage,
      },
      ...subjectSummaries.map((item) => ({
        id: item.id,
        subject: item.subject,
        attended: item.attended,
        total: item.total,
        pending: item.pending,
        percentage: Number(item.percentage || 0),
      })),
    ];
  }, [subjectSummaries]);

  const selectedSubject = useMemo(
    () => subjectSelectorData.find((item) => item.id === selectedSubjectId) || subjectSelectorData[0],
    [selectedSubjectId, subjectSelectorData]
  );

  useEffect(() => {
    if (!subjectSelectorData.find((item) => item.id === selectedSubjectId)) {
      setSelectedSubjectId('overall');
    }
  }, [selectedSubjectId, subjectSelectorData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingShell}>
        <LottieView source={require('../../assets/loadingPage.json')} autoPlay loop style={styles.loadingAnimation} />
        <Text style={styles.loadingText}>Loading your attendance insights...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStudentOverview();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
      >
        <View style={styles.heroShell}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Student Hub</Text>
              <Text style={styles.heroTitle}>Everything you need for attendance in one place</Text>
              <Text style={styles.heroSubtitle}>
                Track your subject performance, live requests, and recent verification activity.
              </Text>
            </View>
            <LottieView
              source={require('../../assets/avatar.json')}
              autoPlay
              loop
              style={styles.heroAnimation}
            />
          </View>

          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroName}>{studentDetail?.name || 'Student'}</Text>
              <Text style={styles.heroMeta}>{studentDetail?.class || 'Class pending'} • {studentDetail?.rollno}</Text>
            </View>
            <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('Requests')}>
              <Feather name="bell" size={18} color={Colors.PRIMARY} />
              <Text style={styles.heroButtonText}>Open Requests</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Attendance</Text>
            <Text style={styles.metricValue}>{dashboardData.averageAttendance}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pending Requests</Text>
            <Text style={styles.metricValue}>{dashboardData.pendingRequests.length}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricCardAccent]}>
            <Text style={styles.metricLabel}>Completed Sessions</Text>
            <Text style={styles.metricValue}>{dashboardData.completedRequests.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Subjects</Text>
            <Text style={styles.metricValue}>{subjectSummaries.length}</Text>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <View style={styles.analyticsHeaderCopy}>
              <Text style={styles.sectionTitle}>Subject Performance</Text>
              <Text style={styles.sectionSubtitle}>View overall attendance or switch to any subject.</Text>
            </View>
            <View style={styles.analyticsBadge}>
              <Text style={styles.analyticsBadgeText}>{subjectSummaries.length || 0} tracked</Text>
            </View>
          </View>
          <View style={styles.analyticsBody}>
            <View style={styles.circularSummaryCard}>
              <CPB
                percentage={selectedSubject?.percentage || 0}
                size={126}
                strokeWidth={10}
                color={Colors.SECONDARY}
                backgroundColor="#E7EEF4"
                tsize={22}
              />
              <Text style={styles.circularSubjectTitle}>{selectedSubject?.subject || 'Overall'}</Text>
              <Text style={styles.circularSubjectMeta}>
                Completed {selectedSubject?.attended || 0}/{selectedSubject?.total || 0} sessions
              </Text>
              <Text style={styles.circularSubjectHint}>{selectedSubject?.pending || 0} pending requests</Text>
            </View>

            <View style={styles.subjectSelectorColumn}>
              {subjectSelectorData.map((item) => {
                const isActive = item.id === selectedSubject?.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.subjectSelectorCard, isActive && styles.subjectSelectorCardActive]}
                    onPress={() => setSelectedSubjectId(item.id)}
                  >
                    <View style={styles.subjectSelectorCopy}>
                      <Text style={[styles.subjectSelectorTitle, isActive && styles.subjectSelectorTitleActive]}>
                        {item.subject}
                      </Text>
                      <Text style={styles.subjectSelectorMeta}>
                        {item.attended}/{item.total} completed
                      </Text>
                    </View>
                    <Text style={[styles.subjectSelectorPercent, isActive && styles.subjectSelectorPercentActive]}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.focusRow}>
          <View style={styles.focusCard}>
            <Text style={styles.focusLabel}>Best Performing</Text>
            <Text style={styles.focusTitle}>{dashboardData.strongestSubject?.subject || 'No data'}</Text>
            <Text style={styles.focusMeta}>{dashboardData.strongestSubject?.percentage || 0}% attendance</Text>
          </View>
          <View style={styles.focusCard}>
            <Text style={styles.focusLabel}>Needs Attention</Text>
            <Text style={styles.focusTitle}>{dashboardData.attentionSubject?.subject || 'No data'}</Text>
            <Text style={styles.focusMeta}>{dashboardData.attentionSubject?.percentage || 0}% attendance</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.timelinePanel}>
          {dashboardData.recentRequests.length ? dashboardData.recentRequests.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.timelineRow}
              onPress={() => navigation.navigate('Requests')}
            >
              <View style={styles.timelineMarkerColumn}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineTitle}>{item.subjectName}</Text>
                <Text style={styles.timelineMeta}>
                  {item.createdBy} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={item.status === 'Requested' ? styles.statusPillPending : styles.statusPillDone}>
                <Text style={item.status === 'Requested' ? styles.statusTextPending : styles.statusTextDone}>
                  {item.status}
                </Text>
              </View>
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyText}>No request activity yet.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Subject Cards</Text>
        <View style={styles.subjectGrid}>
          {subjectSummaries.length ? subjectSummaries.map((item) => (
            <View key={item.id} style={styles.subjectCard}>
              <Text style={styles.subjectTitle}>{item.subject}</Text>
              <Text style={styles.subjectMeta}>{item.attended}/{item.total} completed</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.percentage}%` }]} />
              </View>
              <View style={styles.subjectFooter}>
                <Text style={styles.subjectFooterText}>{item.pending} pending</Text>
                <Text style={styles.subjectPercentage}>{item.percentage}%</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyText}>No enrolled subjects found.</Text>
            </View>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  loadingShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF4F8',
  },
  loadingAnimation: {
    width: '72%',
    height: 120,
  },
  loadingText: {
    marginTop: 14,
    color: '#6D7E8D',
    fontWeight: '600',
  },
  heroShell: {
    backgroundColor: '#0F2B3C',
    borderRadius: 30,
    padding: 22,
    marginTop: 12,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: '#A8C0D0',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#C9D8E2',
    lineHeight: 20,
  },
  heroAnimation: {
    width: 118,
    height: 118,
  },
  heroFooter: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  heroMeta: {
    color: '#AFC2D0',
    marginTop: 5,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroButtonText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  metricCardAccent: {
    backgroundColor: '#F5F9FC',
  },
  metricLabel: {
    color: '#6F8190',
    fontWeight: '600',
  },
  metricValue: {
    color: Colors.PRIMARY,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  analyticsHeaderCopy: {
    flex: 1,
    paddingRight: 4,
  },
  analyticsBadge: {
    backgroundColor: '#E7EEF4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  analyticsBadgeText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
    fontSize: 12,
  },
  analyticsBody: {
    flexDirection: 'column',
    gap: 14,
  },
  circularSummaryCard: {
    backgroundColor: '#F6FAFC',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 230,
  },
  circularSubjectTitle: {
    marginTop: 16,
    color: Colors.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  circularSubjectMeta: {
    marginTop: 8,
    color: '#647887',
    textAlign: 'center',
    lineHeight: 19,
  },
  circularSubjectHint: {
    marginTop: 6,
    color: Colors.SECONDARY,
    fontWeight: '700',
    textAlign: 'center',
  },
  subjectSelectorColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  subjectSelectorCard: {
    width: '48%',
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E7EEF4',
    minHeight: 78,
  },
  subjectSelectorCardActive: {
    backgroundColor: Colors.lightBg,
    borderColor: '#BED2DF',
  },
  subjectSelectorCopy: {
    flex: 1,
    paddingRight: 10,
  },
  subjectSelectorTitle: {
    color: Colors.PRIMARY,
    fontWeight: '700',
    fontSize: 14,
  },
  subjectSelectorTitleActive: {
    color: Colors.SECONDARY,
  },
  subjectSelectorMeta: {
    marginTop: 4,
    color: '#748494',
    fontSize: 12,
  },
  subjectSelectorPercent: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 14,
  },
  subjectSelectorPercentActive: {
    color: Colors.SECONDARY,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#758594',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionLink: {
    color: Colors.SECONDARY,
    fontWeight: '700',
  },
  focusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  focusCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  focusLabel: {
    color: '#7A8997',
    fontSize: 12,
    marginBottom: 8,
  },
  focusTitle: {
    color: Colors.PRIMARY,
    fontSize: 18,
    fontWeight: '800',
  },
  focusMeta: {
    color: '#647887',
    marginTop: 6,
  },
  timelinePanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  timelineMarkerColumn: {
    width: 16,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.PRIMARY,
    marginTop: 6,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#D7E1E9',
    marginTop: 6,
  },
  timelineCopy: {
    flex: 1,
  },
  timelineTitle: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  timelineMeta: {
    color: '#748494',
    marginTop: 5,
  },
  statusPillPending: {
    backgroundColor: '#EAF3EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillDone: {
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusTextPending: {
    color: '#246E47',
    fontWeight: '700',
    fontSize: 12,
  },
  statusTextDone: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  subjectTitle: {
    color: Colors.PRIMARY,
    fontSize: 17,
    fontWeight: '800',
  },
  subjectMeta: {
    color: '#728292',
    marginTop: 6,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E7EEF4',
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.PRIMARY,
  },
  subjectFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subjectFooterText: {
    color: '#758594',
    fontSize: 12,
  },
  subjectPercentage: {
    color: Colors.SECONDARY,
    fontWeight: '700',
  },
  emptyPanel: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  emptyText: {
    color: '#748494',
  },
});

export default StudentMainDashboard;
