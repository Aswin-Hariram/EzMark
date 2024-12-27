import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, SafeAreaView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import CircularProgressBar from '../../Components/CPB';
import CPB from '../../Components/CPB';


const TeacherHistory = () => {
  const suggestions = [
    { id: '2', name: 'Hanna Carroll', username: '@hannacarroll', avatar: 'https://via.placeholder.com/50' },
    { id: '3', name: 'Gabriel Mendes', username: '@gabimendes', avatar: 'https://via.placeholder.com/50' },
    { id: '4', name: 'Frank Williamson', username: '@williamson24', avatar: 'https://via.placeholder.com/50' },
    { id: '5', name: 'Theresa Warren', username: '@theresa_warren', avatar: 'https://via.placeholder.com/50' },
    { id: '6', name: 'Wesley Stones', username: '@stoneswesley', avatar: 'https://via.placeholder.com/50' },
  ];

  const renderPendingRequest = () => (
    <View style={styles.requestCard}>
      <View style={styles.requestDetails}>
        <Text style={styles.classText}>IICSE-A</Text>
        <Text style={styles.dateText}>27 Dec 2024 (Fri)</Text>
      </View>
      <CPB percentage={100} size={70} strokeWidth={8} color="#6A5ACD" />
    </View>
  );
  const renderSuggestion = ({ item }) => (
    <View style={styles.suggestionContainer}>
      <Image style={styles.avatar} source={{ uri: item.avatar }} />
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.buttonText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity style={styles.leftIcon}>
          <Ionicons name="chevron-back-outline" size={24} color="#6A5ACD" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Right Icons */}
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.icon}>
            <Ionicons name="search-outline" size={24} color="#6A5ACD" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.icon}>
            <Ionicons name="filter-outline" size={24} color="#6A5ACD" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 10 }}>
        <Text style={styles.sectionHeader}>Pending Request</Text>
        {renderPendingRequest()}
        <Text style={styles.sectionHeader}>Suggestions for You</Text>
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  leftIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 4,
    color: "#6A5ACD",
    fontSize: 16,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginLeft: 16,
  },
  sectionHeader: {
    fontSize: 18,
    color: '#333',
    marginVertical: 16,
    fontWeight: "600",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  name: {
    color: '#333',
    fontSize: 16,
    fontWeight: "500",
  },
  username: {
    color: '#777',
  },
  followButton: {
    backgroundColor: '#6A5ACD',
    padding: 10,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  buttonText: {
    color: '#fff',
    fontWeight: "500",
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 16,
  },
  requestDetails: {
    flexDirection: 'column',
  },
  classText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
});

export default TeacherHistory;
