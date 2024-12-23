import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native';
const ManageTeachers = () => {
    const[Teachers,setTeachers] = useState([
        { id: '1', profile: require('../assets/Teachers/profile.png'), Name: "Gowtham", Department: "CSE" },
        { id: '2', profile: require('../assets/Teachers/woman.png'), Name: "Jane", Department: "ECE" },
        { id: '3', profile: require('../assets/Teachers/profile.png'), Name: "John", Department: "EEE" },
        { id: '4', profile: require('../assets/Teachers/woman.png'), Name: "Doe", Department: "MECH" },
        { id: '5', profile: require('../assets/Teachers/profile.png'), Name: "Gowtham", Department: "CSE" },
        { id: '6', profile: require('../assets/Teachers/woman.png'), Name: "Jane", Department: "ECE" },
        { id: '7', profile: require('../assets/Teachers/profile.png'), Name: "John", Department: "EEE" },
        { id: '8', profile: require('../assets/Teachers/woman.png'), Name: "Doe", Department: "MECH" },
        { id: '9', profile: require('../assets/Teachers/profile.png'), Name: "Gowtham", Department: "CSE" },
        { id: '10', profile: require('../assets/Teachers/woman.png'), Name: "Jane", Department: "ECE" },
        { id: '11', profile: require('../assets/Teachers/profile.png'), Name: "John", Department: "EEE" },
        { id: '12', profile: require('../assets/Teachers/woman.png'), Name: "Doe", Department: "MECH" },
    ]);
  return (
    <View>
    <View style={styles.search}>
    <TextInput style={styles.input} placeholder='Enter Teacher Name'/>
    <Image style={styles.srh_img} source={require("../assets/Teachers/transparency.png")}/>
    </View>
      <FlatList
        data={Teachers}
        style={{marginTop:10}}
        renderItem={({item})=>
        <View style={styles.container}>
        <View style={styles.image}>
            <Image style={styles.profile_img} source={item.profile}/>
        </View>
        <View style={styles.info}>
          <Text>{item.Name}</Text>
          <Text>Department: {item.Department}</Text>
        </View>
        <TouchableOpacity style={styles.btn}>
            <Image style={styles.rightClick} source={require('../assets/Teachers/right-chevron.png')} />
        </TouchableOpacity>
        </View>}
        keyExtractor={item=> item.id}
      />
      <View style={styles.floating_btn}>
        <Text style={styles.floating_txt}>+</Text>
      </View>
    </View>
  )
}

export default ManageTeachers

const styles = StyleSheet.create({
    container:{
        flexDirection:'row',
        justifyContent:'space-between',
        padding:10,
        borderRadius:8,
        elevation:2,
        shadowColor:'#000',
        shadowRadius:2,
        backgroundColor:'white',
        marginVertical:10,
        marginHorizontal:20,
        alignItems:'center',
        shadowOpacity:0.1,
    },
    profile_img:{
        width:50,
        height:50
    },
    rightClick:{
        width:40,
        height:40
    },
    info:{
        gap:5,
        marginRight:100
    },
    floating_btn:{
        backgroundColor:'orange',
        zIndex:10,
        position:'absolute',
        width:60,
        height:60,
        top:'80%',
        right:20,
        borderRadius:20,
    },
    floating_txt:{
        textAlign:'center',
        color:'white',
        fontSize:30,
        lineHeight:60
    },
    search:{
        backgroundColor:'white',
        marginTop:40,
        flexDirection:'row',
        marginHorizontal:20,
        borderRadius:10,
    },
    input:{
        marginLeft:30
    },
    srh_img:{
        width:18,
        height:18,
        marginTop:11,
        marginLeft:'40%'
    }
})