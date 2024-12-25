import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { TextInput } from 'react-native-paper';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../Config/FirebaseConfig';

const AddClass = () => {

    const navigation = useNavigation();
    const data = [
        { label: 'Computer Science', value: 'cs' },
        { label: 'Mechanical Engineering', value: 'mech' },
        { label: 'Civil Engineering', value: 'civil' },
        { label: 'Electrical Engineering', value: 'eee' },
        { label: 'Electronics & Communication', value: 'ece' },
        { label: 'Information Technology', value: 'it' },
        { label: 'Chemical Engineering', value: 'chem' },
        { label: 'Biotechnology', value: 'bio' },
    ];

    const [departments, setDepartments] = useState([
        { label: 'Engineering', value: 'eng' },
        { label: 'Arts', value: 'arts' },
        { label: 'Science', value: 'sci' },
    ]);
    const [studentDepartment, setStudentDepartment] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [value, setValue] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [teacherName, setTeacherName] = useState('');

    const removeTeacher = (index) => {
        setTeachers(teachers.filter((_, i) => i !== index));
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
            <View style={styles.class_img}>
                <Image style={styles.img} source={require('../../assets/classImage.png')} />
            </View>
            <View style={styles.info}>
                <Text style={styles.headerText}>Create Class</Text>
                <TextInput
                    label="Enter Class"
                    mode="outlined"
                    outlineColor="#153448"
                    activeOutlineColor="#153448"
                    style={styles.inputField}
                />

                <DropDownPicker
                    open={isDropdownOpen}
                    value={studentDepartment}
                    items={departments}
                    setOpen={setIsDropdownOpen}
                    setValue={setStudentDepartment}
                    setItems={setDepartments}
                    placeholder="Select Department"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                />
                <DropDownPicker
                    open={isDropdownOpen}
                    value={studentDepartment}
                    items={departments}
                    setOpen={setIsDropdownOpen}
                    setValue={setStudentDepartment}
                    setItems={setDepartments}
                    placeholder="Select Department"
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainer}
                />
                <Dropdown
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={data}
                    search
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Course"
                    searchPlaceholder="Search..."
                    value={value}
                    onChange={(item) => setValue(item.value)}
                />
                <Text style={styles.info_txt}>Add Tutor</Text>
                <TextInput
                    placeholder="Enter Tutor Name"
                    style={styles.info_input}
                />
                <Text style={styles.info_txt}>Add Teachers of Class</Text>
                <View style={{ flexDirection: 'row' }}>
                    <TextInput
                        style={styles.addTeacher}
                        value={teacherName}
                        placeholder="Enter Teacher Name"
                        onChangeText={setTeacherName}
                    />
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => {
                            if (teacherName.trim()) {
                                setTeachers([...teachers, teacherName.trim()]);
                                setTeacherName('');
                            }
                        }}
                    >
                        <Text style={styles.btnText}>Add</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.teachersChips}>
                    {teachers.map((teacher, index) => (
                        <View key={index} style={styles.chip}>
                            <Text style={styles.chipText}>{teacher}</Text>
                            <TouchableOpacity onPress={() => removeTeacher(index)} style={styles.chipDelete}>
                                <MaterialIcons name="cancel" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
                <TouchableOpacity style={styles.addClassButton} onPress={() => {
                    auth.signOut();
                    navigation.navigate('Login');
                }}>
                    <Text style={styles.addClassText}>Add Class</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

export default AddClass;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: 'white',
    },
    container: {
        padding: 20,
    },
    class_img: {
        alignItems: 'center',
    },
    img: {
        width: 300,
        height: 300,
        resizeMode: 'contain',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    inputField: {
        backgroundColor: 'white',
        marginBottom: 15,
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginBottom: 15,
    },
    dropdownContainer: {
        borderColor: 'gray',
    },
    placeholderStyle: {
        fontSize: 16,
        color: 'gray',
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    info_txt: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    info_input: {
        borderBottomWidth: 1,
        borderColor: 'gray',
        backgroundColor: 'white',
        padding: 5,
        marginBottom: 15,
    },
    addTeacher: {
        borderBottomWidth: 1,
        borderColor: 'gray',
        backgroundColor: 'white',
        padding: 5,
        width: 250,
    },
    btn: {
        backgroundColor: '#2196F3',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 40,
    },
    btnText: {
        color: 'white',
        fontSize: 15,
    },
    teachersChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2196F3',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 10,
        marginBottom: 10,
    },
    chipText: {
        color: 'white',
        fontSize: 14,
    },
    chipDelete: {
        marginLeft: 5,
    },
    addClassButton: {
        backgroundColor: '#2196F3',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    addClassText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
});
