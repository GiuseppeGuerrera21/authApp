import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { useEffect, useState, useContext, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

export default function GameScreen() {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [totalPlaytime, setTotalPlaytime] = useState(0);

    // Animazioni
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;

    const fetchGames = async () => {
        if (!steamId) {
            setError('SteamID non trovato');
            setLoading(false);
            return;
        }

        try {
            console.log('📥 Caricamento giochi per SteamID:', steamId);
            setError(null);

            const apiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
            console.log('🌐 Chiamata API Steam:', apiUrl);

            const gamesResponse = await fetch(apiUrl);
            console.log('📡 Risposta API:', {
                status: gamesResponse.status,
                statusText: gamesResponse.statusText,
                ok: gamesResponse.ok
            });

            if (!gamesResponse.ok) {
                let errorDetails = '';
                try {
                    const errorBody = await gamesResponse.text();
                    errorDetails = errorBody;
                    console.log('📄 Dettagli errore:', errorBody);
                } catch (e) {
                    // Ignora se non riesce a leggere il body
                }

                if (gamesResponse.status === 401) {
                    throw new Error('Chiave API non valida o non autorizzata.');
                }
                if (gamesResponse.status === 403) {
                    throw new Error('Profilo privato. Rendi pubblico il tuo profilo Steam nelle impostazioni della privacy.');
                }
                if (gamesResponse.status === 400) {
                    throw new Error(`Richiesta non valida (400). Verifica che lo Steam ID sia corretto: ${steamId}`);
                }
                throw new Error(`Errore HTTP ${gamesResponse.status}: ${gamesResponse.statusText}${errorDetails ? ' - ' + errorDetails : ''}`);
            }

            const gamesData = await gamesResponse.json();
            const gamesList = gamesData.response?.games || [];

            if (gamesList.length === 0) {
                setGames([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            console.log(`✅ Trovati ${gamesList.length} giochi`);

            // Calcola il tempo totale di gioco
            const total = gamesList.reduce((acc, game) => acc + (game.playtime_forever || 0), 0);
            setTotalPlaytime(total);

            // Ordina per tempo di gioco (maggiore prima)
            const sortedGames = gamesList.sort((a, b) => {
                return (b.playtime_forever || 0) - (a.playtime_forever || 0);
            });

            setGames(sortedGames);
            console.log(`✅ Caricati ${sortedGames.length} giochi`);

        } catch (err) {
            console.error('❌ Errore fetch giochi Steam:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [steamId]);

    useEffect(() => {
        if (!loading && games.length > 0) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(headerScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading, games]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchGames();
    };

    const formatPlaytime = (minutes) => {
        if (minutes === 0) return '0 ore';
        const hours = Math.floor(minutes / 60);
        if (hours < 1) return `${minutes} min`;
        return `${hours.toLocaleString()} ore`;
    };

    const getImageUrl = (appid, imgHash) => {
        if (!imgHash) return null;
        return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${imgHash}.jpg`;
    };

    if (loading) {
        return (
            <View style={{ flex: 1, paddingTop: 34 }}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#0F0A0C', '#22181C', '#1A1216']}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                    <View style={{
                        backgroundColor: 'rgba(230, 57, 70, 0.15)',
                        width: 100,
                        height: 100,
                        borderRadius: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(230, 57, 70, 0.3)',
                    }}>
                        <Text style={{ fontSize: 48 }}>🎮</Text>
                    </View>
                    <ActivityIndicator size="large" color={Colors.accent} />
                    <Text style={{ color: Colors.text, marginTop: 20, fontSize: 16, fontWeight: '600' }}>
                        Caricamento giochi...
                    </Text>
                </LinearGradient>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#0F0A0C', '#22181C', '#1A1216']}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                >
                    <View style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        width: 100,
                        height: 100,
                        borderRadius: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}>
                        <Text style={{ fontSize: 48 }}>⚠️</Text>
                    </View>
                    <Text style={{
                        color: Colors.error,
                        fontSize: 16,
                        textAlign: 'center',
                        marginBottom: 32,
                        lineHeight: 24,
                    }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        onPress={fetchGames}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[Colors.accent, Colors.accentLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                paddingVertical: 16,
                                paddingHorizontal: 40,
                                borderRadius: 16,
                            }}
                        >
                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                                Riprova
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>
            </View>
        );
    }

    if (games.length === 0) {
        return (
            <View style={{ flex: 1 }}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#0F0A0C', '#22181C', '#1A1216']}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}
                >
                    <View style={{
                        backgroundColor: 'rgba(181, 168, 172, 0.15)',
                        width: 100,
                        height: 100,
                        borderRadius: 30,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: 'rgba(181, 168, 172, 0.3)',
                    }}>
                        <Text style={{ fontSize: 48 }}>🎮</Text>
                    </View>
                    <Text style={{
                        color: Colors.text,
                        fontSize: 22,
                        fontWeight: '700',
                        marginBottom: 12,
                    }}>
                        Nessun gioco trovato
                    </Text>
                    <Text style={{
                        color: Colors.textSecondary,
                        fontSize: 15,
                        textAlign: 'center',
                        lineHeight: 22,
                    }}>
                        Non hai ancora giochi su Steam o{'\n'}il profilo potrebbe essere privato
                    </Text>
                </LinearGradient>
            </View>
        );
    }

    const GameCard = ({ item, index }) => {
        const cardFade = useRef(new Animated.Value(0)).current;
        const cardSlide = useRef(new Animated.Value(30)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(cardFade, {
                    toValue: 1,
                    duration: 400,
                    delay: index * 50,
                    useNativeDriver: true,
                }),
                Animated.spring(cardSlide, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    delay: index * 50,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        return (
            <Animated.View
                style={{
                    opacity: cardFade,
                    transform: [{ translateY: cardSlide }],
                    marginBottom: 12,
                    marginHorizontal: 16,
                }}
            >
                <View style={{
                    backgroundColor: 'rgba(60, 48, 54, 0.5)',
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: 'rgba(181, 168, 172, 0.15)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ position: 'relative' }}>
                            {item.img_icon_url ? (
                                <View style={{
                                    borderRadius: 16,
                                    overflow: 'hidden',
                                    borderWidth: 2,
                                    borderColor: 'rgba(230, 57, 70, 0.3)',
                                }}>
                                    <Image
                                        source={{ uri: getImageUrl(item.appid, item.img_icon_url) }}
                                        style={{ width: 64, height: 64 }}
                                    />
                                </View>
                            ) : (
                                <View style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 16,
                                    backgroundColor: 'rgba(60, 48, 54, 0.5)',
                                    borderWidth: 2,
                                    borderColor: 'rgba(181, 168, 172, 0.3)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ fontSize: 32 }}>🎮</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={{
                                color: Colors.text,
                                fontSize: 17,
                                fontWeight: '700',
                                marginBottom: 6,
                            }} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 8,
                                alignSelf: 'flex-start',
                            }}>
                                <Text style={{
                                    color: '#818CF8',
                                    fontSize: 13,
                                    fontWeight: '600',
                                }}>
                                    ⏱️ {formatPlaytime(item.playtime_forever || 0)}
                                </Text>
                            </View>
                            {item.playtime_2weeks > 0 && (
                                <View style={{
                                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    alignSelf: 'flex-start',
                                    marginTop: 6,
                                }}>
                                    <Text style={{
                                        color: '#4ADE80',
                                        fontSize: 12,
                                        fontWeight: '600',
                                    }}>
                                        🎯 {formatPlaytime(item.playtime_2weeks)} recenti
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={{ flex: 1, paddingTop: 20 }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0F0A0C', '#22181C', '#1A1216']}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />

            {/* Header con glassmorphism */}
            <Animated.View style={{
                paddingTop: 56,
                paddingBottom: 20,
                paddingHorizontal: 20,
                transform: [{ scale: headerScale }]
            }}>
                <BlurView intensity={30} tint="dark" style={{
                    overflow: 'hidden',
                    borderRadius: 24,
                    backgroundColor: 'rgba(60, 48, 54, 0.4)',
                    borderWidth: 1,
                    borderColor: 'rgba(181, 168, 172, 0.2)',
                }}>
                    <View style={{ padding: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{
                                backgroundColor: 'rgba(230, 57, 70, 0.2)',
                                width: 48,
                                height: 48,
                                borderRadius: 14,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                            }}>
                                <Text style={{ fontSize: 24 }}>🎮</Text>
                            </View>
                            <Text style={{
                                color: Colors.text,
                                fontSize: 32,
                                fontWeight: '800',
                                letterSpacing: -0.5,
                            }}>
                                I tuoi giochi
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                backgroundColor: 'rgba(230, 57, 70, 0.2)',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                                marginRight: 8,
                            }}>
                                <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>
                                    {games.length} giochi
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                            }}>
                                <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '700' }}>
                                    {formatPlaytime(totalPlaytime)} totali
                                </Text>
                            </View>
                        </View>
                    </View>
                </BlurView>
            </Animated.View>

            <Animated.View style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }}>
                <FlatList
                    data={games}
                    keyExtractor={(item) => item.appid.toString()}
                    renderItem={({ item, index }) => <GameCard item={item} index={index} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.accent}
                            colors={[Colors.accent]}
                        />
                    }
                    contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                />
            </Animated.View>
        </View>
    );
}
