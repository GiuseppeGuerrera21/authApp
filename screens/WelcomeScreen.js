import { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList, Image, RefreshControl, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthContext } from '../store/auth-context';
import { useNavigation } from '@react-navigation/native';

const BACKEND_URL = 'https://steam-auth-backend.onrender.com';
const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

WebBrowser.maybeCompleteAuthSession();

export default function HomePage() {
  console.log('🚀 WelcomeScreen/HomePage component mounted');
  const authCtx = useContext(AuthContext);
  const navigation = useNavigation();
  const [authLoading, setAuthLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const fadeAnim = new Animated.Value(0);

  // DEBUG: Log dello stato del context
  useEffect(() => {
    console.log('🔍 AUTH STATE:', {
      isLoading: authCtx.isLoading,
      isAuthenticated: authCtx.isAuthenticated,
      hasToken: !!authCtx.token,
      hasSteamId: !!authCtx.steamId,
      steamId: authCtx.steamId
    });
  }, [authCtx.isLoading, authCtx.steamId, authCtx.token]);

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
      // Processa solo URL che contengono steamid
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

  useEffect(() => {
    // Naviga automaticamente alla FriendsScreen quando c'è uno steamId
    if (authCtx.steamId) {
      console.log('🎯 SteamID rilevato, navigazione a FriendsScreen...');
      navigation.navigate('Friends');
    }
  }, [authCtx.steamId]);

  const handleDeepLink = (event) => {
    const url = event.url;
    console.log('🔗 Deep link ricevuto:', url);

    // Non processare deep link se l'utente ha già uno steamId
    if (authCtx.steamId) {
      console.log('ℹ️ SteamID già presente, deep link ignorato');
      return;
    }

    // Verifica che l'URL contenga steamid
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
      // Mantieni il token esistente, aggiungi solo steamId
      authCtx.authenticate(authCtx.token || 'steam-token', steamId);
      console.log('✅ SteamID salvato!');
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
        // IMPORTANTE: Processa l'URL ritornato dal browser
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

  const fetchFriends = async () => {
    const steamId = authCtx.steamId;
    console.log('👥 fetchFriends chiamata con steamId:', steamId);
    if (!steamId) {
      console.log('⚠️ Nessun steamId, esco da fetchFriends');
      return;
    }

    console.log('📡 Inizio caricamento amici per steamId:', steamId);
    setFriendsLoading(true);
    setError(null);

    try {
      const friendsResponse = await fetch(
        `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`
      );
      console.log('📥 Risposta GetFriendList:', friendsResponse.status);

      if (!friendsResponse.ok) {
        if (friendsResponse.status === 401 || friendsResponse.status === 403) {
          console.log('🔒 Profilo privato rilevato');
          throw new Error('Profilo privato. Rendi pubblico il tuo profilo Steam.');
        }
        throw new Error(`Errore HTTP: ${friendsResponse.status}`);
      }

      const friendsData = await friendsResponse.json();
      const friendIds = friendsData.friendslist?.friends?.map(f => f.steamid) || [];
      console.log('👥 Trovati', friendIds.length, 'amici');

      if (friendIds.length === 0) {
        console.log('⚠️ Nessun amico trovato');
        setFriends([]);
        setFriendsLoading(false);
        setRefreshing(false);
        return;
      }

      const chunks = [];
      for (let i = 0; i < friendIds.length; i += 100) {
        chunks.push(friendIds.slice(i, i + 100));
      }

      const allPlayers = [];
      for (const chunk of chunks) {
        const playersResponse = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${chunk.join(',')}`
        );
        if (!playersResponse.ok) throw new Error(`Errore HTTP: ${playersResponse.status}`);
        const playersData = await playersResponse.json();
        allPlayers.push(...(playersData.response.players || []));
      }

      const sortedFriends = allPlayers.sort((a, b) => {
        if (a.personastate !== b.personastate) return b.personastate - a.personastate;
        return a.personaname.localeCompare(b.personaname);
      });

      console.log('✅ Amici caricati con successo:', sortedFriends.length);
      setFriends(sortedFriends);
    } catch (err) {
      console.error('❌ Errore caricamento amici:', err.message);
      setError(err.message);
    } finally {
      setFriendsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFriends();
  };

  const handleLogout = () => {
    Alert.alert('Disconnetti Steam', 'Vuoi disconnettere il tuo account Steam?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Disconnetti',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('🔓 Disconnessione da Steam (solo Steam ID)...');
            // Rimuovi lo steamId mantenendo il token per rimanere nell'app
            authCtx.authenticate(authCtx.token, null);
            setFriends([]);
            setError(null);
            console.log('✅ Steam disconnesso - tornerai al pulsante login Steam');
          } catch (err) {
            console.error('❌ Errore disconnessione Steam:', err);
          }
        }
      }
    ]);
  };

  const getStatusColor = (state) => {
    switch (state) {
      case 1: return ['#10b981', '#059669'];
      case 2: return ['#3b82f6', '#2563eb'];
      case 3: return ['#f59e0b', '#d97706'];
      case 4: return ['#a855f7', '#9333ea'];
      default: return ['#6b7280', '#4b5563'];
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case 0: return 'Offline';
      case 1: return 'Online';
      case 2: return 'Occupato';
      case 3: return 'Assente';
      case 4: return 'Non disturbare';
      default: return 'Sconosciuto';
    }
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case 1: return '●';
      case 2: return '●';
      case 3: return '●';
      case 4: return '●';
      default: return '○';
    }
  };

  // LOADING INIZIALE - Solo durante il primo caricamento del context
  if (authCtx.isLoading) {
    console.log('📱 RENDERING: Loading screen');
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} className="flex-1 justify-center items-center">
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text className="text-gray-300 mt-4 text-base">Caricamento...</Text>
      </LinearGradient>
    );
  }

  // SCHERMATA LOGIN
  if (!authCtx.steamId) {
    console.log('📱 RENDERING: Steam login button screen');
    return (
      <LinearGradient colors={['#0f172a', '#1e293b', '#334155']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <Animated.View style={{ flex: 1, opacity: fadeAnim, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          {/* Logo/Icon */}
          <View className="mb-8 items-center">
            <View className="bg-blue-500/20 w-24 h-24 rounded-3xl items-center justify-center mb-4">
              <Text className="text-6xl">🎮</Text>
            </View>
            <Text className="text-white text-4xl font-bold">Steam Friends</Text>
            <View className="h-1 w-20 bg-blue-500 rounded-full mt-3" />
          </View>

          <Text className="text-gray-300 text-base mb-12 text-center px-4 leading-6">
            Connetti il tuo account Steam e scopri chi dei tuoi amici è online in questo momento
          </Text>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={authLoading}
            className="w-full"
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1e40af', '#1e3a8a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-5 px-8 rounded-2xl shadow-lg"
            >
              {authLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className="text-white text-lg font-bold mr-2">Accedi con Steam</Text>
                  <Text className="text-2xl">→</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {authLoading && (
            <View className="mt-6 items-center">
              <ActivityIndicator size="small" color="#60a5fa" />
              <Text className="text-gray-400 text-sm mt-2">Reindirizzamento in corso...</Text>
            </View>
          )}

          {/* Info */}
          <View className="mt-16 bg-slate-800/50 p-4 rounded-xl">
            <Text className="text-gray-400 text-xs text-center leading-5">
              🔒 Login sicuro tramite Steam{'\n'}
              Non memorizziamo la tua password
            </Text>
          </View>

          {/* TEST: Pulsante debug per inserire steamId manualmente */}
          <TouchableOpacity
            onPress={() => {
              // Inserisci il tuo steamId per testare
              const testSteamId = '76561199808123758'; // ← SOSTITUISCI CON IL TUO STEAM ID
              console.log('🧪 TEST: Simulazione deep link con steamId:', testSteamId);
              authCtx.authenticate(authCtx.token || 'steam-token', testSteamId);
            }}
            className="mt-4 bg-yellow-600 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-bold text-center">🧪 TEST: Bypass Steam (Debug)</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // SCHERMATA AMICI
  console.log('📱 RENDERING: Friends list screen');
  const onlineFriends = friends.filter(f => f.personastate > 0).length;

  return (
    <View className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" />

      {/* Header con gradiente */}
      <LinearGradient
        colors={['#1e3a8a', '#1e40af', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-14 pb-6 px-5 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-white text-3xl font-bold mb-1">I tuoi amici</Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                <Text className="text-white font-semibold text-sm">{friends.length} totali</Text>
              </View>
              <View className="bg-green-500/80 px-3 py-1 rounded-full">
                <Text className="text-white font-semibold text-sm">{onlineFriends} online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500/90 px-4 py-2 rounded-xl"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-sm">Esci</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white/10 p-3 rounded-xl mt-2">
          <Text className="text-blue-200 text-xs mb-1">Steam ID</Text>
          <Text className="text-white font-mono text-sm">{authCtx.steamId}</Text>
        </View>
      </LinearGradient>

      {/* Loading amici */}
      {friendsLoading && friends.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-400 mt-4 text-base">Caricamento amici...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-5">
          <View className="bg-red-500/10 p-8 rounded-3xl items-center">
            <Text className="text-6xl mb-4">⚠️</Text>
            <Text className="text-red-400 text-base text-center mb-6">{error}</Text>
            <TouchableOpacity
              onPress={fetchFriends}
              className="bg-blue-600 py-3 px-8 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-white font-bold">Riprova</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : friends.length === 0 ? (
        <View className="flex-1 justify-center items-center px-5">
          <View className="bg-slate-800 p-8 rounded-3xl items-center">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-white text-xl font-bold mb-2">Nessun amico trovato</Text>
            <Text className="text-gray-400 text-sm text-center">
              Il profilo potrebbe essere privato
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.steamid}
          renderItem={({ item }) => {
            const statusColors = getStatusColor(item.personastate);
            return (
              <View className="mx-4 mb-3 overflow-hidden rounded-2xl">
                <LinearGradient
                  colors={['#1e293b', '#334155']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-4"
                >
                  <View className="flex-row items-center">
                    {/* Avatar con border gradiente */}
                    <View className="relative mr-4">
                      <LinearGradient
                        colors={item.personastate > 0 ? statusColors : ['#4b5563', '#6b7280']}
                        className="rounded-full p-0.5"
                      >
                        <Image
                          source={{ uri: item.avatarfull }}
                          style={{ width: 64, height: 64 }}
                          className="rounded-full"
                        />
                      </LinearGradient>
                      {item.personastate > 0 && (
                        <LinearGradient
                          colors={statusColors}
                          className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-slate-800 items-center justify-center"
                        >
                          <Text className="text-white text-xs font-bold">{getStatusIcon(item.personastate)}</Text>
                        </LinearGradient>
                      )}
                    </View>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className="text-white text-base font-bold mb-1" numberOfLines={1}>
                        {item.personaname}
                      </Text>
                      <View className="flex-row items-center">
                        <LinearGradient
                          colors={item.personastate > 0 ? statusColors : ['#4b5563', '#6b7280']}
                          className="px-2 py-1 rounded-lg mr-2"
                        >
                          <Text className="text-white text-xs font-semibold">
                            {getStatusText(item.personastate)}
                          </Text>
                        </LinearGradient>
                      </View>
                      {item.gameextrainfo && (
                        <View className="bg-blue-500/20 px-2 py-1 rounded-lg mt-2 self-start">
                          <Text className="text-blue-300 text-xs font-medium" numberOfLines={1}>
                            🎮 {item.gameextrainfo}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
              colors={["#3b82f6"]}
            />
          }
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
