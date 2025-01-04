import { FlatList, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import CPB from '../../Components/CPB'; // Ensure this component is implemented correctly.
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Colors } from '../../assets/Colors';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';
import { set } from 'date-fns';
import LottieView from 'lottie-react-native';
import { StatusBar } from 'expo-status-bar';


const StudentMainDashboard = ({ studentDetail }) => {
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedId, setSelectedId] = useState(null); // To track selected subject
  const [enrolledSubjects, setEnrolledSubjects] = useState([]);
  const [overAll, setOverAll] = useState([]);
  const [sub, setSub] = useState(overAll[0] || {});
  const [isrefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSubjects = async () => {
    try {
      setIsRefreshing(true)
      setIsLoading(true)
      console.log("Fetching student details...");
      if (!studentDetail || !studentDetail.id) {
        console.error("Student details are missing!");
        return;
      }


      const ref = doc(firestore, "UserData", studentDetail.id);
      const res = await getDoc(ref);
      if (!res.exists()) {
        console.error("No user data found!");
        return;
      }

      const data = res.data();
      if (data.subjects) {
        console.log("Subjects =>", data.subjects);

        // Process subjects
        const subjectDetails = await Promise.all(
          data.subjects.map(async (sub, index) => {
            const findSub = query(
              collection(firestore, `UserData/${studentDetail.id}/AttendanceRequests`),
              where("subjectName", "==", sub)
            );

            const qRes = await getDocs(findSub);
            if (qRes.size === 0) {
              return { id: index, subject: sub, total: 0, attended: 0 };
            } else {
              const totalHrs = qRes.size;
              let completedHrs = 0;

              qRes.forEach((sd) => {
                const entryData = sd.data();
                if (entryData.status === "Completed") {
                  completedHrs++;
                }
              });

              return {
                id: index,
                subject: sub,
                total: totalHrs,
                attended: completedHrs,
                percentage: ((completedHrs / totalHrs) * 100 || 0).toFixed(1)
              };
            }
          })
        );

        setEnrolledSubjects(subjectDetails);
        console.log("Updated enrolled subjects =>", subjectDetails);
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
    }
    finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [studentDetail]); // Fetch subjects when `studentDetail` changes

  useEffect(() => {
    if (enrolledSubjects.length > 0) {
      let overAllPercentage = 0;
      let size = 0;

      // Calculate individual subject percentages and collect data
      const overallData = enrolledSubjects.map((data, ind) => {
        const percentage = (data.attended / data.total) * 100 || 0;
        const roundedPercentage = parseFloat(percentage.toFixed(1));
        if (roundedPercentage != 0) {
          overAllPercentage += roundedPercentage;
          size++;
        }
        return { id: ind + 1, name: data.subject, percentage: roundedPercentage };
      });
      const averagePercentage = size > 0 ? (overAllPercentage / size).toFixed(1) : 0;
      const overallResult = [{ id: 0, name: "Overall", percentage: parseFloat(averagePercentage) }, ...overallData];
      setSub({ id: 0, name: "Overall", percentage: parseFloat(averagePercentage) })
      setOverAll(overallResult);
    }
    setIsRefreshing(false)
  }, [enrolledSubjects]); // Recalculate overall when `enrolledSubjects` changes

  const handleSubjectPress = (item) => {
    setSub({ name: item.name, percentage: item.percentage });
    setSelectedId(item.id);
  };

  const renderSubjects = (item) => {
    return (
      <View style={styles.attendanceContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.subjectName}>{item.subject}</Text>
            <Text style={styles.detailsText}>
              Total Hours: {item.total} | Attend Hours: {item.attended}
            </Text>
          </View>
          <Text style={styles.percentageStyle}>{item.percentage || 0}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              { width: `${(item.attended / item.total) * 100 || 0}%` },
            ]}
          />
        </View>
      </View>
    );
  };


  const handleSort = () => {
    const sortedSubjects = [...enrolledSubjects];

    if (sortOrder === "desc") {
      // Sort in descending order
      sortedSubjects.sort((a, b) => b.percentage - a.percentage);
      setSortOrder("asc"); // Toggle to ascending order after sorting
    } else {
      // Sort in ascending order
      sortedSubjects.sort((a, b) => a.percentage - b.percentage);
      setSortOrder("desc"); // Toggle to descending order after sorting
    }

    setEnrolledSubjects(sortedSubjects); // Update the state with sorted subjects
  };

  const renderView = () => (
    <View>
      <View style={styles.header}>
        <Feather name="menu" size={28} color="black" />
        <Text style={styles.headerText}>EzMark</Text>
        <MaterialCommunityIcons name="qrcode-scan" size={24} color="black" />
      </View>

      <View style={styles.container}>
        <View style={styles.overview}>
          <Text style={styles.title}>{sub.name}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <CPB percentage={sub.percentage} size={'110'} strokeWidth={8} color={Colors.SECONDARY} tsize={22} />
          </View>
          <FlatList
            data={overAll}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSubjectPress(item)}>
                <View
                  style={[
                    styles.subject,
                    selectedId === item.id && styles.elevatedSubject,
                  ]}
                >
                  <View style={styles.btn} />
                  <View style={styles.textContainer}>
                    <Text style={styles.subjectText}>{item.name}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />

        </View>
      </View>

      <View style={styles.enrolledHeader}>
        <Text style={styles.enrolledText}>Enrolled Subjects</Text>
        <TouchableOpacity onPress={handleSort}>
          <Ionicons name="filter-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView>

        <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
          <LottieView source={require('../../assets/loadingPage.json')} autoPlay loop style={{ width: '70%', height: 100 }} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView>
      <StatusBar
       // Android-specific background color
        barStyle="light-content"  // Text and icon color (light-content or dark-content)
      />
      <FlatList
        showsVerticalScrollIndicator={false}
        style={styles.mainList}
        ListHeaderComponent={renderView()}
        ListFooterComponent={
          (
            <FlatList
              style={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              data={enrolledSubjects}
              renderItem={({ item }) => renderSubjects(item)}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        refreshing={isrefreshing}
        onRefresh={fetchSubjects}
      />
    </SafeAreaView>
  );
};

export default StudentMainDashboard;

const styles = StyleSheet.create({
  mainList: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingHorizontal: 5,
  },
  container: {
    padding: 16,
    marginVertical: 10,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,  // Make sure the container takes up the available space
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align the items vertically centered
    width: '100%', // Ensure it takes up the full width of the container
  },

  progressBarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    maxWidth: '40%', // Restrict progress bar width to avoid overflow
  },

  subject: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
    padding: 5,
    borderRadius: 5,
  },

  elevatedSubject: {
    elevation: 10,
    backgroundColor: Colors.lightBg, // Highlighted color
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  btn: {
    width: 10,
    height: 10,
    backgroundColor: "#8babc1",
    borderRadius: 5,
  },

  textContainer: {
    flexDirection: 'row',
  },

  subjectText: {
    marginLeft: 5,
    fontFamily: 'Signika-regular',
    fontSize: 15,
    textAlign: 'left',
  },

  overview: {
    marginBottom: 20,
  },

  attendanceContainer: {
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  subjectName: {
    fontSize: 18,
    fontFamily: 'Signika-regular',
    fontWeight: '500',
    marginBottom: 5,
    color: 'black',
  },
  detailsText: {
    fontSize: 14,
    color: '#111',
    fontFamily: 'Signika-regular',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.lightBg,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.SECONDARY,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 15,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  enrolledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  enrolledText: {
    fontSize: 22,
    fontFamily: 'Signika-regular',
    fontWeight: 500,
    color: Colors.SECONDARY
  },
  percentageStyle: {
    fontSize: 16,
    fontFamily: 'metro-regular',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
