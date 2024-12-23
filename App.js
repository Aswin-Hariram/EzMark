import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Screens/HomeScreen';

export default function App() {


  const RootStack = createNativeStackNavigator({
    screens: {
      Home: HomeScreen,
    },
  });
  return (
    <RootStack />
  );
}

