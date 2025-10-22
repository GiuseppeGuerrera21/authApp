import { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar, Animated, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';

const BACKEND_URL = 'https://steam-auth-backend.onrender.com';
const { width } = Dimensions.get('window');

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  console.log('🚀 WelcomeScreen component mounted');
  const authCtx = useContext(AuthContext);
  const [authLoading, setAuthLoading] = useState(false);

  // Animazioni multiple
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animazioni per gli elementi decorativi
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animazione di entrata principale
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Animazione di rotazione continua per il logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animazione pulse per il pulsante
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animazioni floating per elementi decorativi
    Animated.loop(
      Animated.sequence([
        Animated.timing(float1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(float1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(float2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float3, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(float3, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  const translateY1 = float1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const translateY2 = float2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const translateY3 = float3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25],
  });

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Sfondo con gradiente animato */}
      <LinearGradient
        colors={['#0F0A0C', '#22181C', '#1A1216']}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />

      {/* Elementi decorativi animati di sfondo */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 100,
          right: 30,
          transform: [{ translateY: translateY1 }],
          opacity: 0.15
        }}
      >
        <LinearGradient
          colors={['#E63946', '#FF7B89']}
          style={{ width: 150, height: 150, borderRadius: 75 }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 150,
          left: -50,
          transform: [{ translateY: translateY2 }],
          opacity: 0.1
        }}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={{ width: 200, height: 200, borderRadius: 100 }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 250,
          left: 50,
          transform: [{ translateY: translateY3 }],
          opacity: 0.08
        }}
      >
        <LinearGradient
          colors={['#10B981', '#34D399']}
          style={{ width: 120, height: 120, borderRadius: 60 }}
        />
      </Animated.View>

      {/* Contenuto principale */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 32
        }}
      >
        {/* Logo animato con glassmorphism */}
        <Animated.View
          style={{
            marginBottom: 48,
            alignItems: 'center',
            transform: [{ rotate: spin }]
          }}
        >
          <View style={{
            backgroundColor: 'rgba(230, 57, 70, 0.15)',
            width: 120,
            height: 120,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: 'rgba(230, 57, 70, 0.3)',
            shadowColor: '#E63946',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }}>
            <LinearGradient
              colors={['rgba(230, 57, 70, 0.2)', 'rgba(255, 123, 137, 0.1)']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 40,
              }}
            />
            <Text style={{ fontSize: 64 }}>🎮</Text>
          </View>

          <Text style={{
            color: Colors.text,
            fontSize: 42,
            fontWeight: '800',
            letterSpacing: -1,
            textShadowColor: 'rgba(230, 57, 70, 0.3)',
            textShadowOffset: { width: 0, height: 4 },
            textShadowRadius: 10,
          }}>
            Steam Friends
          </Text>

          <View style={{
            height: 4,
            width: 80,
            borderRadius: 2,
            marginTop: 16,
            overflow: 'hidden'
          }}>
            <LinearGradient
              colors={['#E63946', '#FF7B89', '#E63946']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>

        <Text style={{
          color: '#B5A8AC',
          fontSize: 17,
          marginBottom: 60,
          textAlign: 'center',
          paddingHorizontal: 20,
          lineHeight: 26,
          fontWeight: '500',
        }}>
          Connetti il tuo account Steam per{'\n'}
          vedere amici, giochi e trofei
        </Text>

        {/* Pulsante Login con glassmorphism e animazione */}
        <Animated.View style={{
          width: '100%',
          transform: [{ scale: authLoading ? 1 : pulseAnim }]
        }}>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={authLoading}
            activeOpacity={0.85}
            style={{ width: '100%' }}
          >
            <View style={{
              overflow: 'hidden',
              borderRadius: 20,
              shadowColor: '#E63946',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            }}>
              <BlurView intensity={20} tint="light" style={{
                overflow: 'hidden',
                borderRadius: 20,
              }}>
                <LinearGradient
                  colors={['#E63946', '#FF7B89', '#E63946']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 20,
                    paddingHorizontal: 32,
                    borderRadius: 20,
                  }}
                >
                  {authLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <ActivityIndicator color="#FFFFFF" style={{ marginRight: 12 }} />
                      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                        Connessione...
                      </Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginRight: 8 }}>
                        Accedi con Steam
                      </Text>
                      <Text style={{ fontSize: 24 }}>→</Text>
                    </View>
                  )}
                </LinearGradient>
              </BlurView>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Info card con glassmorphism */}
        <View style={{
          marginTop: 60,
          backgroundColor: 'rgba(60, 48, 54, 0.4)',
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(181, 168, 172, 0.2)',
          width: '100%',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 24, marginRight: 8 }}>🔒</Text>
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600' }}>
              Login Sicuro
            </Text>
          </View>
          <Text style={{
            color: Colors.textSecondary,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 20,
          }}>
            Autenticazione tramite Steam ufficiale{'\n'}
            Non memorizziamo mai le tue credenziali
          </Text>
        </View>

        {/* Features cards */}
        <View style={{
          flexDirection: 'row',
          marginTop: 24,
          gap: 12,
          width: '100%',
          justifyContent: 'space-between'
        }}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(60, 48, 54, 0.3)',
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(181, 168, 172, 0.15)',
          }}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>👥</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
              Amici
            </Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: 'rgba(60, 48, 54, 0.3)',
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(181, 168, 172, 0.15)',
          }}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🎯</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
              Achievements
            </Text>
          </View>

          <View style={{
            flex: 1,
            backgroundColor: 'rgba(60, 48, 54, 0.3)',
            padding: 16,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: 'rgba(181, 168, 172, 0.15)',
          }}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>🏆</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
              Profilo
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
