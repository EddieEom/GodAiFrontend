import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import GongsuScreen from './screens/GongsuScreen';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import { useState } from 'react';
import type { FortuneRequest, FortuneResponse } from './services/api';

export type RootStackParamList = {
  HomeScreen: undefined;
  GongsuScreen: {
    userInput: string;
    payload?: FortuneRequest;
    fortune?: FortuneResponse;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = async () => {
    await Font.loadAsync({
      'JosonGungseo': require('./assets/fonts/JOSON_Gungseo.ttf'),
    });
  };

  if (!fontsLoaded) {
    return (
      <AppLoading
        startAsync={loadFonts}
        onFinish={() => setFontsLoaded(true)}
        onError={console.warn}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomeScreen"
        screenOptions={{
          headerStyle: { backgroundColor: '#0d0d0d' },
          headerTintColor: '#ffcc99',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 20,
            fontFamily: 'JosonGungseo',
          },
        }}
      >
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ title: '神 AI' }}
        />
        <Stack.Screen
          name="GongsuScreen"
          component={GongsuScreen}
          options={{ title: '점사 결과' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
