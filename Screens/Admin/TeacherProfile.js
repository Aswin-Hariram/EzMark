import { StyleSheet, Text, View, Image, TouchableOpacity, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import dp from "../../assets/Teachers/profile.png";
import { TextInput } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
const TeacherProfile = ({ route }) => {
  const { teacher } = route.params;

  const [chips, setChips] = useState([
    { id: 1, label: 'Teams' },
    { id: 2, label: 'Tasks' },
    { id: 3, label: 'Creators' },
    { id: 4, label: 'Notes' },
    { id: 5, label: 'Priority' },
    { id: 6, label: 'Companies' },
    { id: 7, label: 'Projects' },
    
  ]);

  const [selectedChip, setSelectedChip] = useState(null);
  const [edit, setEdit] = useState(false);
  const navigation = useNavigation();

  const removeChip = (chipId) => {
    setChips((prevChips) => prevChips.filter((chip) => chip.id !== chipId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Edit Teacher</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            style={styles.profileImage}
            source={dp}
            width={60}
            height={60}
          />

        </View>
        <View style={{ ...styles.classesHeader, flexDirection: 'column' }}>
          <Text style={styles.classTitle}>Personal details</Text>
          <TextInput
            label="Teacher Name"
            value={teacher.Name}

            mode="outlined"
            outlineColor="#153448"
            activeOutlineColor='#153448'
            style={{
              backgroundColor: 'white',
              marginBottom: 10,
              marginTop: 20,

            }}
          />


          <TextInput
            label="Teacher Email"
            mode="outlined"
            outlineColor="#153448"
            activeOutlineColor='#153448'
            style={{
              backgroundColor: 'white',
              marginBottom: 10,
            }}
          />


          <TextInput
            label="Teacher Department"
            mode="outlined"
            outlineColor="#153448"
            activeOutlineColor='#153448'
            style={{
              backgroundColor: 'white',
              marginBottom: 10,
            }}
          />


        </View>
        {/* Classes Handling */}
        <View style={styles.classesHeader}>
          <Text style={styles.classTitle}>Subjects Enrolled</Text>
          <TouchableOpacity onPress={() => setEdit(!edit)}>
            <View style={styles.editChip}>
              <Text style={styles.editChipText}>{edit ? 'Done' : 'Edit'}</Text>
            </View>
          </TouchableOpacity>
        </View>


        {/* Chips Section */}
        <View style={styles.chipContainer}>
          {chips.length > 0 ? (
            chips.map((chip) => (
              <View key={chip.id} style={styles.chipWrapper}>
                <TouchableOpacity
                  style={selectedChip === chip.id ? styles.selectedChip : styles.chip}
                  onPress={() => setSelectedChip(chip.id)}
                >
                  <Text
                    style={
                      selectedChip === chip.id ? styles.selectedChipText : styles.chipText
                    }
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
                {edit && (
                  <TouchableOpacity
                    style={styles.removeChipButton}
                    onPress={() => removeChip(chip.id)}
                  >
                    <Ionicons name="close" size={20} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noChipsText}>No Classes Enrolled</Text>
          )}
        </View>
        {/* Classes Handling */}
        <View style={styles.classesHeader}>
          <Text style={styles.classTitle}>Classes Classes</Text>
          <TouchableOpacity onPress={() => setEdit(!edit)}>
            <View style={styles.editChip}>
              <Text style={styles.editChipText}>{edit ? 'Done' : 'Edit'}</Text>
            </View>
          </TouchableOpacity>
        </View>


        {/* Chips Section */}
        <View style={styles.chipContainer}>
          {chips.length > 0 ? (
            chips.map((chip) => (
              <View key={chip.id} style={styles.chipWrapper}>
                <TouchableOpacity
                  style={selectedChip === chip.id ? styles.selectedChip : styles.chip}
                  onPress={() => setSelectedChip(chip.id)}
                >
                  <Text
                    style={
                      selectedChip === chip.id ? styles.selectedChipText : styles.chipText
                    }
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
                {edit && (
                  <TouchableOpacity
                    style={styles.removeChipButton}
                    onPress={() => removeChip(chip.id)}
                  >
                    <Ionicons name="close" size={20} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noChipsText}>No Classes Available</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Platform.OS === 'android' ? 20 : 0,
    marginLeft: 5,

  },
  headerText: {
    marginLeft: 10,
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  classesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    marginHorizontal: 15,
    marginTop: 20,
  },
  classTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  editChip: {
    backgroundColor: '#F1F1F1',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  editChipText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 20,
  },
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#EEEEEE',
    opacity:0.8,
    borderColor:Colors.SECONDARY,
    borderWidth:0.5,
    borderRadius: 20,
  },
  selectedChip: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'gray',
  },
  chipText: {
    fontSize: 14,
    color: 'black',
  },
  selectedChipText: {
    fontSize: 14,
    color: 'black',
  },
  removeChipButton: {
    marginLeft: 5,
  },
  noChipsText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },
});
