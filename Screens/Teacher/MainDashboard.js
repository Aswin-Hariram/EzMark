import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import LottieView from 'lottie-react-native';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { Colors } from '../../assets/Colors';
import { firestore } from '../../Config/FirebaseConfig';

const screenWidth = Dimensions.get('window').width;
const palette = ['#153448', '#2C566F', '#4C748B', '#7396AA', '#9AB7C7'];

const shortenLabel = (value = '') => {
  if (value.length <= 7) {
    return value;
  }

  return `${value.slice(0, 6)}…`;
};

const MainDashboard = ({ teacherDetail }) => {
  const navigation = useNavigation();
  const [allRequests, setAllRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTeacherRequests = async () => {
    if (!teacherDetail?.id) {
      setAllRequests([]);
      return;
    }

    try {
      const requestRef = collection(firestore, `UserData/${teacherDetail.id}/AttendanceRequests`);
      const docsSnap = await getDocs(requestRef);
      const requests = docsSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllRequests(requests);
    } catch (error) {
      console.log('Error fetching teacher requests:', error);
      setAllRequests([]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeacherRequests();
  }, [teacherDetail?.id]);

  const dashboardData = useMemo(() => {
    const classes = teacherDetail?.classes || [];
    const pendingRequests = allRequests.filter((item) => item.status === 'Requested');
    const closedRequests = allRequests.filter((item) => item.status !== 'Requested');
    const totalStudentsReached = allRequests.reduce(
      (sum, item) => sum + Number(item.totalNumberOfStudents || 0),
      0
    );
    const averageCompletion = allRequests.length
      ? Math.round(
        allRequests.reduce((sum, item) => {
          const total = Number(item.totalNumberOfStudents || 0);
          const pending = Number(item.pendingNumberOfStudents || 0);
          const completion = total ? ((total - pending) / total) * 100 : 0;
          return sum + completion;
        }, 0) / allRequests.length
      )
      : 0;

    const classStats = classes.map((className, index) => {
      const related = allRequests.filter((item) => item.class === className);
      const totalStudents = related.reduce((sum, item) => sum + Number(item.totalNumberOfStudents || 0), 0);
      const totalPending = related.reduce((sum, item) => sum + Number(item.pendingNumberOfStudents || 0), 0);
      const completionRate = totalStudents ? Math.round(((totalStudents - totalPending) / totalStudents) * 100) : 0;

      return {
        className,
        totalRequests: related.length,
        activeRequests: related.filter((item) => item.status === 'Requested').length,
        subjects: [...new Set(related.map((item) => item.subjectName).filter(Boolean))],
        completionRate,
        color: palette[index % palette.length],
      };
    });

    const topClasses = [...classStats]
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 5);

    return {
      classStats,
      topClasses,
      pendingRequests,
      closedRequests,
      totalStudentsReached,
      averageCompletion,
      liveShare: allRequests.length ? Math.round((pendingRequests.length / allRequests.length) * 100) : 0,
      recentRequests: allRequests.slice(0, 4),
      busiestClass: topClasses[0] || null,
    };
  }, [allRequests, teacherDetail?.classes]);

  const chartData = useMemo(() => ({
    labels: dashboardData.topClasses.length
      ? dashboardData.topClasses.map((item) => shortenLabel(item.className))
      : ['No data'],
    datasets: [{
      data: dashboardData.topClasses.length
        ? dashboardData.topClasses.map((item) => item.totalRequests || 0)
        : [0],
    }],
  }), [dashboardData.topClasses]);

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
              fetchTeacherRequests();
            }}
            colors={[Colors.PRIMARY]}
          />
        }
      >
        <View style={styles.heroShell}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Teacher Dashboard</Text>
              <Text style={styles.heroTitle}>Run your attendance workflow with less friction</Text>
              <Text style={styles.heroSubtitle}>
                See what is live, which classes are busiest, and where follow-up is needed.
              </Text>
            </View>
            <LottieView
              source={require('../../assets/classAnimation.json')}
              autoPlay
              loop
              style={styles.heroAnimation}
            />
          </View>

          <View style={styles.heroFooter}>
            <View>
              <Text style={styles.heroTeacherLabel}>Signed in as</Text>
              <Text style={styles.heroTeacherName}>{teacherDetail?.name || 'Teacher'}</Text>
            </View>
            <View style={styles.heroActionRow}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => navigation.navigate('CreateRequest', { teacherDetail })}
              >
                <MaterialIcons name="add-task" size={20} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>New Request</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={() => navigation.navigate('Requests')}
              >
                <Feather name="activity" size={18} color={Colors.PRIMARY} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.mosaicRow}>
          <View style={[styles.mosaicCard, styles.mosaicTall]}>
            <Text style={styles.mosaicLabel}>Live Requests</Text>
            <Text style={styles.mosaicValue}>{dashboardData.pendingRequests.length}</Text>
            <Text style={styles.mosaicHint}>currently accepting attendance</Text>
          </View>
          <View style={styles.mosaicStack}>
            <View style={styles.mosaicCard}>
              <Text style={styles.mosaicLabel}>Avg Completion</Text>
              <Text style={styles.mosaicValue}>{dashboardData.averageCompletion}%</Text>
            </View>
            <View style={styles.mosaicCard}>
              <Text style={styles.mosaicLabel}>Students Reached</Text>
              <Text style={styles.mosaicValue}>{dashboardData.totalStudentsReached}</Text>
            </View>
          </View>
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Class Activity</Text>
              <Text style={styles.sectionSubtitle}>Line view of request volume across your busiest classes.</Text>
            </View>
            <View style={styles.analyticsBadge}>
              <Text style={styles.analyticsBadgeText}>{dashboardData.topClasses.length || 0} tracked</Text>
            </View>
          </View>

          <LineChart
            data={chartData}
            width={screenWidth - 68}
            height={220}
            bezier
            fromZero
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withShadow
            withDots
            chartConfig={{
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(21, 52, 72, ${opacity})`,
              labelColor: () => '#576D7D',
              strokeWidth: 3,
              fillShadowGradientFrom: '#2C566F',
              fillShadowGradientTo: '#9AB7C7',
              fillShadowGradientFromOpacity: 0.28,
              fillShadowGradientToOpacity: 0.02,
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: '#102B3C',
                fill: '#FFFFFF',
              },
              propsForBackgroundLines: {
                stroke: '#EEF3F6',
              },
            }}
            style={styles.lineChart}
          />
        </View>

        <View style={styles.signalCard}>
          <View style={styles.signalHeader}>
            <Text style={styles.sectionTitle}>Live Sessions</Text>
            <Text style={styles.signalLiveShare}>{dashboardData.liveShare}% live</Text>
          </View>
          <View style={styles.signalTrack}>
            <View style={[styles.signalFillPrimary, { width: `${dashboardData.liveShare}%` }]} />
          </View>
          <View style={styles.signalLegendRow}>
            <Text style={styles.signalLegendText}>Live sessions: {dashboardData.pendingRequests.length}</Text>
            <Text style={styles.signalLegendText}>Closed sessions: {dashboardData.closedRequests.length}</Text>
          </View>

          {dashboardData.busiestClass ? (
            <View style={styles.focusCard}>
              <Text style={styles.focusLabel}>Focus Class</Text>
              <Text style={styles.focusTitle}>{dashboardData.busiestClass.className}</Text>
              <Text style={styles.focusMeta}>
                {dashboardData.busiestClass.totalRequests} requests • {dashboardData.busiestClass.completionRate}% completion
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Requests')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentPanel}>
          {dashboardData.recentRequests.length ? dashboardData.recentRequests.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentRow}
              onPress={() => navigation.navigate('RequestDetails', {
                requestDetails: item,
                type: item.status === 'Requested' ? 'Pending' : 'History',
                teacherDetail,
              })}
            >
              <View style={styles.recentTimeline}>
                <View style={styles.recentDot} />
                <View style={styles.recentLine} />
              </View>
              <View style={styles.recentCopy}>
                <Text style={styles.recentTitle}>{item.class} • {item.subjectName}</Text>
                <Text style={styles.recentSubtitle}>
                  {item.status} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyText}>No requests created yet.</Text>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Teaching Portfolio</Text>
        </View>
        <View style={styles.portfolioGrid}>
          {dashboardData.classStats.length ? dashboardData.classStats.map((item) => (
            <TouchableOpacity
              key={item.className}
              style={styles.portfolioCard}
              onPress={() => navigation.navigate('ClassSummary', { className: item.className, teacherDetail })}
            >
              <View style={[styles.portfolioAccent, { backgroundColor: item.color }]} />
              <Text style={styles.portfolioTitle}>{item.className}</Text>
              <Text style={styles.portfolioMeta}>{item.totalRequests} requests</Text>
              <View style={styles.portfolioProgressTrack}>
                <View style={[styles.portfolioProgressFill, { width: `${item.completionRate}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.portfolioCompletion}>{item.completionRate}% completion</Text>
              <View style={styles.subjectWrap}>
                {item.subjects.length ? item.subjects.slice(0, 2).map((subject) => (
                  <View key={subject} style={styles.subjectChip}>
                    <Text style={styles.subjectChipText}>{subject}</Text>
                  </View>
                )) : (
                  <Text style={styles.portfolioHint}>No subjects active yet</Text>
                )}
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyPortfolio}>
              <Text style={styles.emptyText}>No classes assigned yet.</Text>
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
    backgroundColor: '#EEF3F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  heroShell: {
    backgroundColor: '#102B3C',
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
    color: '#A9C0D0',
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#C5D6E1',
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
  heroTeacherLabel: {
    color: '#8FB0C2',
    fontSize: 12,
  },
  heroTeacherName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 4,
  },
  heroActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryAction: {
    backgroundColor: '#2F627E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryAction: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosaicRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mosaicTall: {
    flex: 1.1,
  },
  mosaicStack: {
    flex: 1,
    gap: 12,
  },
  mosaicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  mosaicLabel: {
    color: '#708191',
    fontWeight: '600',
  },
  mosaicValue: {
    color: Colors.PRIMARY,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
  },
  mosaicHint: {
    color: '#8A99A6',
    marginTop: 8,
    lineHeight: 18,
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
  analyticsBadge: {
    backgroundColor: '#E7EEF4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  analyticsBadgeText: {
    color: Colors.PRIMARY,
    fontWeight: '700',
    fontSize: 12,
  },
  barChart: {
    marginLeft: -10,
    borderRadius: 18,
  },
  signalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  signalLiveShare: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
  },
  signalTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: '#E8EEF3',
    overflow: 'hidden',
  },
  signalFillPrimary: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.PRIMARY,
  },
  signalLegendRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  signalLegendText: {
    color: '#708191',
    fontWeight: '600',
    fontSize: 12,
  },
  focusCard: {
    marginTop: 16,
    backgroundColor: '#102B3C',
    borderRadius: 22,
    padding: 16,
  },
  focusLabel: {
    color: '#8FB0C2',
    fontSize: 12,
    marginBottom: 6,
  },
  focusTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 20,
  },
  focusMeta: {
    color: '#C8D8E2',
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 18,
  },
  sectionSubtitle: {
    color: '#738393',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionLink: {
    color: Colors.SECONDARY,
    fontWeight: '700',
  },
  recentPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  recentRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F6',
  },
  recentTimeline: {
    alignItems: 'center',
    width: 16,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.PRIMARY,
    marginTop: 6,
  },
  recentLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#D7E2EA',
    marginTop: 6,
  },
  recentCopy: {
    flex: 1,
  },
  recentTitle: {
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  recentSubtitle: {
    color: '#728292',
    marginTop: 5,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
  },
  portfolioAccent: {
    width: 34,
    height: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  portfolioTitle: {
    color: Colors.PRIMARY,
    fontWeight: '800',
    fontSize: 17,
  },
  portfolioMeta: {
    color: '#738393',
    marginTop: 4,
  },
  portfolioProgressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E8EEF3',
    overflow: 'hidden',
    marginTop: 14,
  },
  portfolioProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  portfolioCompletion: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    marginTop: 8,
  },
  subjectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  subjectChip: {
    backgroundColor: '#EAF0F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  subjectChipText: {
    color: Colors.SECONDARY,
    fontWeight: '700',
    fontSize: 12,
  },
  portfolioHint: {
    color: '#8B99A6',
    fontSize: 12,
  },
  emptyPortfolio: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  emptyText: {
    color: '#728292',
  },
});

export default MainDashboard;
