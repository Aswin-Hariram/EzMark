import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { TextInput } from 'react-native-paper';
import Entypo from '@expo/vector-icons/Entypo';

const PasswordTextInput = ({
    placeholder = "Password",
    value,
    onChangeText,
    lockIconSource = require('../assets/Login/lock.png'),
    outlineColor = 'white',
    activeOutlineColor = 'white',
    styleprop = {}
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    return (
        <View style={styles.inputWrapper}>
            {/* Lock Icon */}
            <Image style={styles.icon} source={lockIconSource} />

            {/* Password Input */}
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor="gray"
                secureTextEntry={!isPasswordVisible}
                value={value}
                onChangeText={onChangeText}
                mode="outlined"
                outlineColor={outlineColor}
                activeOutlineColor={activeOutlineColor}
                theme={{
                    colors: {
                        text: 'black',
                        placeholder: 'gray',
                    },
                }}
            />

            {/* Toggle Visibility Icon */}
            <TouchableOpacity
                style={styles.eyeIconWrapper}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
                <Entypo
                    name={isPasswordVisible ? 'eye-with-line' : 'eye'}
                    size={20}
                    color="gray"
                />
            </TouchableOpacity>
        </View>
    );
};

export default PasswordTextInput;

const styles = StyleSheet.create({
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderColor: "#153448",
        borderRadius: 8,
        borderWidth: 1,
        paddingHorizontal: 10,
    },
    icon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        height: 50, // Ensure enough height for cursor to be visible
        backgroundColor: 'white', // Set a visible background
    },
    eyeIconWrapper: {
        marginLeft: 10,
    },
});
