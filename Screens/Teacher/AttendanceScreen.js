import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react';
import CPB from '../../Components/CPB'; 
const AttendanceScreen = () => {
  const students = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      attendance: 95,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      attendance: 92,
    },
    {
      id: 3,
      name: "Mark Lee",
      email: "mark.lee@example.com",
      attendance: 89,
    },{
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@example.com",
      attendance: 98,
    },
  ];
  
  return (
    <SafeAreaView style={{flex:1,backgroundColor:'white',position:'relative'}}>
    <TouchableOpacity style={styles.leftarrow}>
      <Image style={styles.leftarrowimg} source={require('../asset Student/left.png')}/>
    </TouchableOpacity>
    <View style={styles.img}>
    <Image style={styles.introimg}  source={require('../asset Student/Teacher in empty classroom throwing her hands up.png')}/>
    </View>
    <Text style={styles.txt}>Class A</Text>
    <Text style={{fontSize:20,fontWeight:'bold',marginTop:30,padding:16}}>Students Overview</Text>
    <FlatList 
    data={students}
    renderItem={({item})=>
    <View style={styles.student}>
       <View style={styles.profileimg}>
        <Image style={{width:50,height:50}} source={require('../asset Student/user (1).png')}/>
       </View>
       <View style={styles.stdinfo}>
          <Text style={{fontWeight:'bold',fontSize:15}}>{item.name}</Text>
          <Text style={{marginTop:5}}>{item.email}</Text>
       </View>
       <View style={styles.prograssbar}>
         <CPB strokeWidth={5} tsize={10} size={50} percentage={item.attendance}/>
       </View>
    </View>}
    keyExtractor={(item)=>item.id} />
    </SafeAreaView>
  )
}

export default AttendanceScreen

const styles = StyleSheet.create({
    introimg:{
        width:190,
        height:150
    },
    img:{
      backgroundColor:'white',
      borderRadius:20,
      justifyContent:'center',
      alignItems:'center',
      borderBottomWidth:0.2,
       marginTop:50,
       borderBottomColor:'gray',
       paddingBottom:30
    },
    txt:{
      textAlign:"center",
      fontSize:30,
      color:'black',
      fontWeight:'bold',
    },
    student:{
      flexDirection:'row',
      marginHorizontal:20,
      marginVertical:15,
      backgroundColor:'white',
      borderRadius:10,
      padding:10,
      elevation:10
    },
    profileimg:{
      marginHorizontal:10
    },
    stdinfo:{
      marginHorizontal:10,
      width:200
    },
    prograssbar:{
      marginLeft:10
    },
    leftarrow:{
      zIndex:10,
      position:'absolute',
      top:25,
      left:10
    },
    leftarrowimg:{
      width:50,
      height:50,
    }
})