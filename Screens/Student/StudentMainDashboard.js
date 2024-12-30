import { FlatList, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import CPB from '../../Components/CPB'; // Ensure this component is implemented correctly.

const StudentMainDashboard = () => {
  const [sub, setSub] = useState({ name: 'Overview', percentage: 60 });
  const [selectedId, setSelectedId] = useState(null); // To track selected subject

  const subject = [
    { id: 0, name: 'Overview', percentage: 70 },
    { id: 1, name: 'Math', percentage: 90 },
    { id: 2, name: 'EVS', percentage: 80 },
    { id: 3, name: 'Tamil', percentage: 70 },
    { id: 4, name: 'OOAD', percentage: 60 },
  ];

  const attendance = [
    { id: 1, subject: 'Math', total: 64, attended: 30 },
    { id: 2, subject: 'EVS', total: 74, attended: 54 },
    { id: 3, subject: 'Tamil', total: 50, attended: 30 },
    { id: 4, subject: 'OOAD', total: 59, attended: 55 },
    { id: 5, subject: 'Science', total: 70, attended: 60 },
  ];

  const handleSubjectPress = (item) => {
    setSub({ name: item.name, percentage: item.percentage });
    setSelectedId(item.id); // Update the selected subject ID
  };

  return (
    <ScrollView style={{ padding: 10 }}>
    <View style={styles.header}>
      <View style={styles.subhead}>
        <Image style={styles.img} source={require('../Imagefolder/user (1).png')}/>
      </View>
      <View style={styles.subhead}>
        <Text style={{fontSize:20,fontWeight:'bold',lineHeight:40}}>EzMrak</Text>
      </View>
      <View style={styles.subhead}>
        <Image style={styles.img} source={require('../Imagefolder/burger-bar.png')}/>
      </View>
    </View>
      {/* Overview Section */}
      <View style={styles.container}>
        <View style={styles.overview}>
          <Text style={styles.title}>{sub.name}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <CPB percentage={sub.percentage} strokeWidth={20}  color="blue" />
          </View>
          <FlatList
            data={subject}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSubjectPress(item)}>
                <View
                  style={[
                    styles.subject,
                    selectedId === item.id && styles.elevatedSubject, // Apply elevation if selected
                  ]}
                >
                  <View style={styles.btn} />
                  <View style={styles.textContainer}>
                    <Text style={styles.subjectText}>{item.name}</Text>
                    <Text style={styles.subjectText}>{item.percentage}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      </View>

      {/* Subjects Section */}
      <View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 20 }}>Subjects</Text>
      </View>
      <FlatList
        data={attendance}
        renderItem={({ item }) => (
          <View style={styles.attendanceContainer}>
            <Text style={styles.subjectName}>{item.subject}</Text>
            <Text style={styles.detailsText}>
              Total Hours: {item.total} | Attend Hours: {item.attended}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progress,
                  { width: `${(item.attended / item.total) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </ScrollView>
  );
};

export default StudentMainDashboard;

const styles = StyleSheet.create({
  container: {
   padding:16,
    marginVertical: 20,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
  },
  progressContainer: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressBarContainer: {
    marginLeft: 20,
  },
  subject: {
    flexDirection: 'row',
    marginLeft: 20,
    marginRight:5,
    gap: 5,
    marginVertical: 1,
    padding: 5,
    borderRadius: 5,
  },
  elevatedSubject: {
    elevation: 10,
    backgroundColor: '#e0f7fa', // Highlighted color
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  btn: {
    width: 20,
    height: 20,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
  textContainer: {
    flexDirection: 'row',
  },
  subjectText: {
    marginLeft: 5,
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
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'black',
  },
  detailsText: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'gray',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 5,
  },
  progress: {
    height: '100%',
    backgroundColor: 'blue',
  },
  img:{
    width:40,
    height:40
  },
  header:{
    flexDirection:'row',
    marginTop:20,
    marginHorizontal:20,
    gap:80,
    elevation:5,
    backgroundColor:'#fff',
    padding:10,
    justifyContent:'space-evenly'
  },
});
