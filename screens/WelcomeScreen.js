import { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';

const BACKEND_URL = 'https://steam-auth-backend.onrender.com';

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  console.log('🚀 WelcomeScreen component mounted');
  const authCtx = useContext(AuthContext);
  const [authLoading, setAuthLoading] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    console.log('🔧 Configurazione listener deep link...');
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔔 EVENTO URL RICEVUTO:', event);
      handleDeepLink(event);
    });

    Linking.getInitialURL().then(url => {
      console.log('🔍 InitialURL:', url);
      if (url && url.includes('steamid=')) {
        console.log('✅ InitialURL contiene steamid');
        handleDeepLink({ url });
      }
    });

    console.log('✅ Listener deep link configurato');
    return () => {
      console.log('🔴 Rimozione listener deep link');
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (event) => {
    const url = event.url;
    console.log('🔗 Deep link ricevuto:', url);

    if (!url || !url.includes('steamid=')) {
      console.log('⚠️ URL non contiene steamid:', url);
      return;
    }

    console.log('🔍 Cerco steamid nell\'URL...');
    const steamIdMatch = url.match(/[?&]steamid=(\d+)/);
    if (steamIdMatch) {
      const steamId = steamIdMatch[1];
      console.log('✅ SteamID trovato:', steamId);
      console.log('💾 Salvataggio steamId nel context...');
      authCtx.authenticate(authCtx.token || 'steam-token', steamId);
      console.log('✅ SteamID salvato! Il TabStack si mostrerà automaticamente grazie al context.');
    } else {
      console.log('⚠️ URL contiene steamid ma formato non valido:', url);
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      const authUrl = `${BACKEND_URL}/auth/steam`;
      const redirectUrl = 'steamloginapp://auth';
      console.log('🔑 Iniziando Steam auth...');
      console.log('   Auth URL:', authUrl);
      console.log('   Redirect URL:', redirectUrl);

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      console.log('🔙 Risultato browser:', result);

      if (result.type === 'cancel') {
        Alert.alert('Annullato', 'Login annullato');
      } else if (result.type === 'success') {
        console.log('✅ Auth completata con successo');
        if (result.url) {
          console.log('🔗 Processing URL da WebBrowser:', result.url);
          handleDeepLink({ url: result.url });
        }
      }
    } catch (err) {
      console.error('❌ Errore Steam auth:', err);
      Alert.alert('Errore', 'Impossibile completare il login: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary500 }}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={{ flex: 1, opacity: fadeAnim, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Logo/Icon */}
        <View className="mb-8 items-center">
          <View className="bg-primary700/20 w-24 h-24 rounded-3xl items-center justify-center mb-4">
            <Text className="text-6xl">🎮</Text>
          </View>
          <Text className="text-text text-4xl font-bold">Steam Friends</Text>
          <View className="h-1 w-20 bg-primary700 rounded-full mt-3" />
        </View>

        <Text className="text-slate-300 text-base mb-12 text-center px-4 leading-6">
          Connetti il tuo account Steam per vedere amici, giochi e trofei
        </Text>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={authLoading}
          className="w-full"
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#DBEAFE', '#93C5FD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-5 px-8 rounded-2xl shadow-lg"
          >
            {authLoading ? (
              <ActivityIndicator color="#610440" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className="text-primary100 text-lg font-bold mr-2">Accedi con Steam</Text>
                <Text className="text-2xl">→</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {authLoading && (
          <View className="mt-6 items-center">
            <ActivityIndicator size="small" color="#DBEAFE" />
            <Text className="text-slate-400 text-sm mt-2">Reindirizzamento in corso...</Text>
          </View>
        )}

        {/* Info */}
        <View className="mt-16 bg-slate-800/50 p-4 rounded-xl">
          <Text className="text-slate-400 text-xs text-center leading-5">
            🔒 Login sicuro tramite Steam{'\n'}
            Non memorizziamo la tua password
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Logout',
              'Vuoi disconnetterti completamente? Tornerai alla schermata di login.',
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => authCtx.logout()
                }
              ]
            );
          }}
          className="bg-error/90 px-6 py-3 rounded-xl mt-6"
        >
          <Text className="text-text font-bold text-sm">Logout</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
