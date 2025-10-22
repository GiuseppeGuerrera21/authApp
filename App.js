import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AppLoading from 'expo-app-loading';
import "./global.css"

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileScreen from './screens/ProfileScreen';
import GameScreen from './screens/GameScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import MainScreen from './screens/MainScreen';
import AuthContextProvider from './store/auth-context';
import FriendsScreen from './screens/FriendsScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import CustomTabBar from './components/CustomTabBar';
import { Colors } from './constants/styles';
import { useContext } from 'react';
import { AuthContext } from './store/auth-context';

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
      <Stack.Screen name="MainScreen" component={MainScreen} />
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
  return (
    <MyTabs.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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
        options={{ title: 'Profilo' }}
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
  const authCtx = useContext(AuthContext);

  // Usa isLoading dal context invece di gestire uno stato separato
  if (authCtx.isLoading) {
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
