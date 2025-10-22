import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AppLoading from 'expo-app-loading';
import { Ionicons } from '@expo/vector-icons';
import "./global.css"

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileScreen from './screens/ProfileScreen';
import GameScreen from './screens/GameScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import AuthContextProvider from './store/auth-context';
import FriendsScreen from './screens/FriendsScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import { Colors } from './constants/styles';
import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from './store/auth-context';
import IconButton from './components/ui/IconButton';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Stack = createNativeStackNavigator();

const MyTabs = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.primary500 },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedStack() {
  const authCtx = useContext(AuthContext);

  // Se l'utente ha già uno steamId, mostra direttamente il TabStack
  if (authCtx.steamId) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.primary500 },
          headerTintColor: 'white',
          contentStyle: { backgroundColor: Colors.primary100 },
        }}
      >
        <Stack.Screen
          name="TabStack"
          component={TabStack}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    );
  }

  // Altrimenti mostra la schermata Welcome per connettere Steam
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary500 },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.primary100 },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

function TabStack() {
  const authCtx = useContext(AuthContext);

  return (
    <MyTabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: Colors.primary500,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: 'white',
        contentStyle: { backgroundColor: Colors.primary100 },
        tabBarStyle: {
          backgroundColor: Colors.primary500,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Games') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Achievements') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <MyTabs.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Amici' }}
      />
      <MyTabs.Screen
        name="Games"
        component={GameScreen}
        options={{ title: 'Giochi' }}
      />
      <MyTabs.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Trofei' }}
      />
      <MyTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profilo',
          headerRight: () => (
            <IconButton
              icon="exit"
              color="white"
              size={24}
              onPress={authCtx.disconnectSteam}
            />
          ),
        }}
      />
    </MyTabs.Navigator>
  );
}


function Navigation() {
  const authCtx = useContext(AuthContext);

  return (
    <NavigationContainer>
      {!authCtx.isAuthenticated && <AuthStack />}
      {authCtx.isAuthenticated && <AuthenticatedStack />}
    </NavigationContainer>
  );
}

function Root() {
  const [isTryingLogin, setIsTryingLogin] = useState(true);
  const authCtx = useContext(AuthContext);

  useEffect(() => {
    async function fetchToken() {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        authCtx.authenticate(storedToken);
      }
      setIsTryingLogin(false);
    }
    fetchToken();
  }, []);

  if (isTryingLogin) {
    return <AppLoading />
  }

  return <Navigation />;
}


export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <AuthContextProvider>
        <Root />
      </AuthContextProvider>
    </>
  );
}
