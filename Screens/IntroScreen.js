import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import LottieView from 'lottie-react-native';

const IntroScreen = ({ navigation }) => {
 
    useEffect(() => {
        const timer = setTimeout(() => {
          navigation.replace('Login'); 
        }, 3000); 
        return () => clearTimeout(timer); 
      }, [navigation]);
  return (
    <View style={styles.container}>
      <LottieView 
        style={styles.lottie} 
        source={require('./Animation/LoginAnimation.json')} 
        autoPlay 
        loop 
      />
      <Text style={styles.title}>Welcome to EzMark</Text>
      <View style={styles.phraseContainer}>
        <Text style={styles.subtitle}>"EzMark: Quick, easy, and fun attendance!"</Text>
      </View>
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  lottie: {
    width: 400,
    height: 400,
  },
  title: {
    fontSize: 32,
    color: '#3b5998', 
    fontWeight: 'bold',
    marginTop: -40,
  },
  phraseContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555', 
    marginVertical: 2,
    marginLeft:10 
  },
});
