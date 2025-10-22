import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { useEffect, useState, useContext, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

export default function FriendsScreen() {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Animazioni
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;

    const fetchFriends = async () => {
        if (!steamId) {
            setError('SteamID non trovato');
            setLoading(false);
            return;
        }

        try {
            console.log('📥 Caricamento amici per SteamID:', steamId);
            setError(null);

            const apiUrl = `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`;
            console.log('🌐 Chiamata API Steam:', apiUrl);

            const friendsResponse = await fetch(apiUrl);
            console.log('📡 Risposta API:', {
                status: friendsResponse.status,
                statusText: friendsResponse.statusText,
                ok: friendsResponse.ok
            });

            if (!friendsResponse.ok) {
                // Proviamo a leggere il corpo della risposta per più dettagli
                let errorDetails = '';
                try {
                    const errorBody = await friendsResponse.text();
                    errorDetails = errorBody;
                    console.log('📄 Dettagli errore:', errorBody);
                } catch (e) {
                    // Ignora se non riesce a leggere il body
                }

                if (friendsResponse.status === 401) {
                    throw new Error('Chiave API non valida o non autorizzata.');
                }
                if (friendsResponse.status === 403) {
                    throw new Error('Profilo privato. Rendi pubblico il tuo profilo Steam nelle impostazioni della privacy.');
                }
                if (friendsResponse.status === 400) {
                    throw new Error(`Richiesta non valida (400). Verifica che lo Steam ID sia corretto: ${steamId}`);
                }
                throw new Error(`Errore HTTP ${friendsResponse.status}: ${friendsResponse.statusText}${errorDetails ? ' - ' + errorDetails : ''}`);
            }

            const friendsData = await friendsResponse.json();
            const friendIds = friendsData.friendslist?.friends?.map(f => f.steamid) || [];

            if (friendIds.length === 0) {
                setFriends([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            console.log(`✅ Trovati ${friendIds.length} amici`);

            // Gestisci chunking per evitare limitazioni API (max 100)
            const chunks = [];
            for (let i = 0; i < friendIds.length; i += 100) {
                chunks.push(friendIds.slice(i, i + 100));
            }

            const allPlayers = [];
            for (const chunk of chunks) {
                const playersResponse = await fetch(
                    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${chunk.join(',')}`
                );

                if (!playersResponse.ok) {
                    throw new Error(`Errore HTTP: ${playersResponse.status}`);
                }

                const playersData = await playersResponse.json();
                allPlayers.push(...(playersData.response.players || []));
            }

            // Ordina: online prima, poi per nome
            const sortedFriends = allPlayers.sort((a, b) => {
                if (a.personastate !== b.personastate) {
                    return b.personastate - a.personastate;
                }
                return a.personaname.localeCompare(b.personaname);
            });

            setFriends(sortedFriends);
            console.log(`✅ Caricati ${sortedFriends.length} profili`);

        } catch (err) {
            console.error('❌ Errore fetch amici Steam:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, [steamId]);

    useEffect(() => {
        if (!loading && friends.length > 0) {
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
    }, [loading, friends]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchFriends();
    };

    const getStatusText = (state) => {
        switch (state) {
            case 0: return '🔴 Offline';
            case 1: return '🟢 Online';
            case 2: return '🔵 Occupato';
            case 3: return '🟡 Assente';
            case 4: return '🟣 Non disturbare';
            default: return '⚪ Sconosciuto';
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1 }}>
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
                        <Text style={{ fontSize: 48 }}>👥</Text>
                    </View>
                    <ActivityIndicator size="large" color={Colors.accent} />
                    <Text style={{ color: Colors.text, marginTop: 20, fontSize: 16, fontWeight: '600' }}>
                        Caricamento amici...
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
                        onPress={fetchFriends}
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

    if (friends.length === 0) {
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
                        <Text style={{ fontSize: 48 }}>👥</Text>
                    </View>
                    <Text style={{
                        color: Colors.text,
                        fontSize: 22,
                        fontWeight: '700',
                        marginBottom: 12,
                    }}>
                        Nessun amico trovato
                    </Text>
                    <Text style={{
                        color: Colors.textSecondary,
                        fontSize: 15,
                        textAlign: 'center',
                        lineHeight: 22,
                    }}>
                        Il profilo potrebbe essere privato
                    </Text>
                </LinearGradient>
            </View>
        );
    }

    const onlineFriends = friends.filter(f => f.personastate > 0).length;

    const FriendCard = ({ item, index }) => {
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
                            <View style={{
                                borderRadius: 50,
                                overflow: 'hidden',
                                borderWidth: 3,
                                borderColor: item.personastate > 0 ? 'rgba(74, 222, 128, 0.5)' : 'rgba(181, 168, 172, 0.3)',
                            }}>
                                <Image
                                    source={{ uri: item.avatarfull }}
                                    style={{ width: 64, height: 64 }}
                                />
                            </View>
                            {item.personastate > 0 && (
                                <View style={{
                                    position: 'absolute',
                                    bottom: 2,
                                    right: 2,
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    backgroundColor: item.personastate === 1 ? '#4ADE80' :
                                                     item.personastate === 2 ? '#3B82F6' :
                                                     item.personastate === 3 ? '#F59E0B' :
                                                     item.personastate === 4 ? '#A855F7' : '#6B7280',
                                    borderWidth: 2,
                                    borderColor: '#22181C',
                                }} />
                            )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={{
                                color: Colors.text,
                                fontSize: 17,
                                fontWeight: '700',
                                marginBottom: 4,
                            }} numberOfLines={1}>
                                {item.personaname}
                            </Text>
                            <Text style={{
                                color: item.personastate === 1 ? '#4ADE80' :
                                       item.personastate === 2 ? '#3B82F6' :
                                       item.personastate === 3 ? '#F59E0B' :
                                       item.personastate === 4 ? '#A855F7' : '#9CA3AF',
                                fontSize: 14,
                                fontWeight: '600',
                                marginBottom: 4,
                            }}>
                                {getStatusText(item.personastate)}
                            </Text>
                            {item.gameextrainfo && (
                                <View style={{
                                    backgroundColor: 'rgba(230, 57, 70, 0.2)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 8,
                                    alignSelf: 'flex-start',
                                    marginTop: 4,
                                }}>
                                    <Text style={{
                                        color: Colors.accentLight,
                                        fontSize: 12,
                                        fontWeight: '600',
                                    }} numberOfLines={1}>
                                        🎮 {item.gameextrainfo}
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
                                <Text style={{ fontSize: 24 }}>👥</Text>
                            </View>
                            <Text style={{
                                color: Colors.text,
                                fontSize: 32,
                                fontWeight: '800',
                                letterSpacing: -0.5,
                            }}>
                                I tuoi amici
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
                                    {friends.length} amici
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: 'rgba(74, 222, 128, 0.2)',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 12,
                            }}>
                                <Text style={{ color: '#4ADE80', fontSize: 13, fontWeight: '700' }}>
                                    {onlineFriends} online
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
                    data={friends}
                    keyExtractor={(item) => item.steamid}
                    renderItem={({ item, index }) => <FriendCard item={item} index={index} />}
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