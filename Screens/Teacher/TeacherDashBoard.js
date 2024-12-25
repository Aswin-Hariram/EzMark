import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { auth } from '../../Config/FirebaseConfig'
import { useNavigation } from '@react-navigation/native'

const TeacherDashBoard = () => {
  const navigation = useNavigation();
  return (
    <View>
      <TouchableOpacity onPress={() => {
        auth.signOut();
        navigation.navigate("Login")
      }} style={{marginTop:200}}>
        <Text >TeacherDashBoard</Text>
      </TouchableOpacity>
    </View>
  )
}

export default TeacherDashBoard

const styles = StyleSheet.create({})