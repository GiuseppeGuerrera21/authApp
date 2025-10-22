import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { useEffect, useState, useContext, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

export default function AchievementsScreen() {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAchievements, setLoadingAchievements] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({ total: 0, unlocked: 0, percentage: 0 });

    // Animazioni
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Fetch giochi con achievements
    const fetchGames = async () => {
        if (!steamId) {
            setError('SteamID non trovato');
            setLoading(false);
            return;
        }

        try {
            console.log('📥 Caricamento giochi con achievements per SteamID:', steamId);
            setError(null);

            const apiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1`;
            console.log('🌐 Chiamata API Steam:', apiUrl);

            const gamesResponse = await fetch(apiUrl);

            if (!gamesResponse.ok) {
                if (gamesResponse.status === 401) {
                    throw new Error('Chiave API non valida o non autorizzata.');
                }
                if (gamesResponse.status === 403) {
                    throw new Error('Profilo privato. Rendi pubblico il tuo profilo Steam nelle impostazioni della privacy.');
                }
                throw new Error(`Errore HTTP ${gamesResponse.status}`);
            }

            const gamesData = await gamesResponse.json();
            let gamesList = gamesData.response?.games || [];

            if (gamesList.length === 0) {
                setGames([]);
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Filtra solo giochi con più di 0 minuti di gioco (probabilmente hanno achievements)
            gamesList = gamesList.filter(game => game.playtime_forever > 0);

            // Ordina per tempo di gioco
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

    // Fetch achievements per un gioco specifico
    const fetchAchievements = async (appId, gameName) => {
        setLoadingAchievements(true);
        setSelectedGame({ appId, name: gameName });
        setAchievements([]);

        try {
            console.log('🏆 Caricamento achievements per appId:', appId);

            // Prima otteniamo lo schema degli achievements
            const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${appId}`;
            const schemaResponse = await fetch(schemaUrl);

            if (!schemaResponse.ok) {
                throw new Error('Gioco senza achievements o profilo privato');
            }

            const schemaData = await schemaResponse.json();
            const achievementSchema = schemaData.game?.availableGameStats?.achievements || [];

            if (achievementSchema.length === 0) {
                setAchievements([]);
                setStats({ total: 0, unlocked: 0, percentage: 0 });
                setLoadingAchievements(false);
                return;
            }

            // Poi otteniamo i progressi del giocatore
            const playerStatsUrl = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&appid=${appId}`;
            const playerStatsResponse = await fetch(playerStatsUrl);

            let playerAchievements = [];
            if (playerStatsResponse.ok) {
                const playerData = await playerStatsResponse.json();
                playerAchievements = playerData.playerstats?.achievements || [];
            }

            // Combina schema con progressi
            const combinedAchievements = achievementSchema.map(schema => {
                const playerProgress = playerAchievements.find(p => p.apiname === schema.name);
                return {
                    apiname: schema.name,
                    name: schema.displayName || schema.name,
                    description: schema.description || 'Nessuna descrizione',
                    icon: schema.icon,
                    iconGray: schema.icongray,
                    achieved: playerProgress?.achieved === 1,
                    unlocktime: playerProgress?.unlocktime || 0
                };
            });

            // Ordina: sbloccati prima, poi per nome
            const sortedAchievements = combinedAchievements.sort((a, b) => {
                if (a.achieved !== b.achieved) {
                    return b.achieved - a.achieved;
                }
                return a.name.localeCompare(b.name);
            });

            setAchievements(sortedAchievements);

            // Calcola statistiche
            const unlockedCount = sortedAchievements.filter(a => a.achieved).length;
            const totalCount = sortedAchievements.length;
            const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

            setStats({
                total: totalCount,
                unlocked: unlockedCount,
                percentage: percentage
            });

            console.log(`✅ Caricati ${sortedAchievements.length} achievements (${unlockedCount}/${totalCount} sbloccati)`);

        } catch (err) {
            console.error('❌ Errore fetch achievements:', err);
            setAchievements([]);
            setStats({ total: 0, unlocked: 0, percentage: 0 });
        } finally {
            setLoadingAchievements(false);
        }
    };

    useEffect(() => {
        fetchGames();
    }, [steamId]);

    useEffect(() => {
        if (!loading && games.length > 0 && !selectedGame) {
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
    }, [loading, games, selectedGame]);

    useEffect(() => {
        if (stats.percentage > 0) {
            Animated.timing(progressAnim, {
                toValue: stats.percentage,
                duration: 1000,
                useNativeDriver: false,
            }).start();
        }
    }, [stats.percentage]);

    const onRefresh = () => {
        setRefreshing(true);
        setSelectedGame(null);
        setAchievements([]);
        fetchGames();
    };

    const getImageUrl = (appid, imgHash) => {
        if (!imgHash) return null;
        return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${imgHash}.jpg`;
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                        <Text style={{ fontSize: 48 }}>🏆</Text>
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

    // Se non è selezionato nessun gioco, mostra la lista
    if (!selectedGame) {
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
                            <Text style={{ fontSize: 48 }}>🏆</Text>
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
                            Gioca ad alcuni giochi per vedere i trofei!
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
                    <TouchableOpacity
                        onPress={() => fetchAchievements(item.appid, item.name)}
                        activeOpacity={0.8}
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
                                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 8,
                                        alignSelf: 'flex-start',
                                    }}>
                                        <Text style={{
                                            color: '#A855F7',
                                            fontSize: 13,
                                            fontWeight: '600',
                                        }}>
                                            Tocca per vedere i trofei
                                        </Text>
                                    </View>
                                </View>

                                <Text style={{ color: Colors.accent, fontSize: 28, marginLeft: 8 }}>›</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
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
                                    <Text style={{ fontSize: 24 }}>🏆</Text>
                                </View>
                                <Text style={{
                                    color: Colors.text,
                                    fontSize: 32,
                                    fontWeight: '800',
                                    letterSpacing: -0.5,
                                }}>
                                    Trofei Steam
                                </Text>
                            </View>
                            <Text style={{
                                color: Colors.textSecondary,
                                fontSize: 14,
                                fontWeight: '500',
                            }}>
                                Seleziona un gioco per vedere i trofei
                            </Text>
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
                        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
                        showsVerticalScrollIndicator={false}
                    />
                </Animated.View>
            </View>
        );
    }

    // Vista degli achievements per il gioco selezionato
    const AchievementCard = ({ item, index }) => {
        const cardFade = useRef(new Animated.Value(0)).current;
        const cardSlide = useRef(new Animated.Value(30)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(cardFade, {
                    toValue: 1,
                    duration: 400,
                    delay: index * 30,
                    useNativeDriver: true,
                }),
                Animated.spring(cardSlide, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    delay: index * 30,
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
                    backgroundColor: item.achieved ? 'rgba(60, 48, 54, 0.6)' : 'rgba(60, 48, 54, 0.3)',
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: item.achieved ? 'rgba(74, 222, 128, 0.3)' : 'rgba(181, 168, 172, 0.15)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ position: 'relative' }}>
                            <View style={{
                                borderRadius: 14,
                                overflow: 'hidden',
                                borderWidth: 2,
                                borderColor: item.achieved ? 'rgba(74, 222, 128, 0.5)' : 'rgba(181, 168, 172, 0.3)',
                            }}>
                                <Image
                                    source={{ uri: item.achieved ? item.icon : item.iconGray }}
                                    style={{ width: 60, height: 60 }}
                                />
                            </View>
                            {item.achieved && (
                                <View style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    backgroundColor: '#4ADE80',
                                    borderRadius: 12,
                                    width: 24,
                                    height: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#22181C',
                                }}>
                                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={{
                                color: item.achieved ? Colors.text : Colors.textSecondary,
                                fontSize: 16,
                                fontWeight: '700',
                                marginBottom: 4,
                            }} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={{
                                color: item.achieved ? Colors.textSecondary : 'rgba(181, 168, 172, 0.5)',
                                fontSize: 13,
                                lineHeight: 18,
                                marginBottom: 4,
                            }} numberOfLines={2}>
                                {item.description}
                            </Text>
                            {item.achieved && item.unlocktime > 0 && (
                                <View style={{
                                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 6,
                                    alignSelf: 'flex-start',
                                }}>
                                    <Text style={{
                                        color: '#4ADE80',
                                        fontSize: 11,
                                        fontWeight: '600',
                                    }}>
                                        🎉 {formatDate(item.unlocktime)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0F0A0C', '#22181C', '#1A1216']}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />

            {/* Header */}
            <View style={{
                paddingTop: 56,
                paddingBottom: 20,
                paddingHorizontal: 20,
            }}>
                <BlurView intensity={30} tint="dark" style={{
                    overflow: 'hidden',
                    borderRadius: 24,
                    backgroundColor: 'rgba(60, 48, 54, 0.4)',
                    borderWidth: 1,
                    borderColor: 'rgba(181, 168, 172, 0.2)',
                }}>
                    <View style={{ padding: 20 }}>
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedGame(null);
                                setAchievements([]);
                                progressAnim.setValue(0);
                            }}
                            style={{ marginBottom: 16 }}
                            activeOpacity={0.7}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ color: Colors.accent, fontSize: 18, marginRight: 4 }}>‹</Text>
                                <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '600' }}>
                                    Indietro
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <Text style={{
                            color: Colors.text,
                            fontSize: 24,
                            fontWeight: '800',
                            marginBottom: 16,
                        }} numberOfLines={1}>
                            {selectedGame.name}
                        </Text>

                        {!loadingAchievements && stats.total > 0 && (
                            <View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ color: Colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                                        Progresso
                                    </Text>
                                    <Text style={{ color: Colors.text, fontSize: 13, fontWeight: '700' }}>
                                        {stats.unlocked}/{stats.total} ({stats.percentage}%)
                                    </Text>
                                </View>
                                <View style={{
                                    height: 8,
                                    backgroundColor: 'rgba(60, 48, 54, 0.5)',
                                    borderRadius: 4,
                                    overflow: 'hidden',
                                }}>
                                    <Animated.View style={{
                                        height: '100%',
                                        width: progressWidth,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                    }}>
                                        <LinearGradient
                                            colors={['#4ADE80', '#22C55E']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{ flex: 1 }}
                                        />
                                    </Animated.View>
                                </View>
                            </View>
                        )}
                    </View>
                </BlurView>
            </View>

            {loadingAchievements ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                        <Text style={{ fontSize: 48 }}>🏆</Text>
                    </View>
                    <ActivityIndicator size="large" color={Colors.accent} />
                    <Text style={{ color: Colors.text, marginTop: 20, fontSize: 16, fontWeight: '600' }}>
                        Caricamento trofei...
                    </Text>
                </View>
            ) : achievements.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
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
                        <Text style={{ fontSize: 48 }}>🏆</Text>
                    </View>
                    <Text style={{
                        color: Colors.text,
                        fontSize: 22,
                        fontWeight: '700',
                        marginBottom: 12,
                    }}>
                        Nessun trofeo disponibile
                    </Text>
                    <Text style={{
                        color: Colors.textSecondary,
                        fontSize: 15,
                        textAlign: 'center',
                        lineHeight: 22,
                    }}>
                        Questo gioco non ha trofei o{'\n'}il profilo è privato
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={achievements}
                    keyExtractor={(item) => item.apiname}
                    renderItem={({ item, index }) => <AchievementCard item={item} index={index} />}
                    contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
