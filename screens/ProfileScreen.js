import { useState, useContext, useEffect, useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Switch, Alert, Image, Animated, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    User,
    RefreshCw,
    Bell,
    LogOut,
    ChevronRight,
    Gamepad2,
    Users,
} from 'lucide-react-native';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/styles';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

const Profilo = () => {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [playerData, setPlayerData] = useState(null);
    const [stats, setStats] = useState({ games: 0, friends: 0 });
    const [loading, setLoading] = useState(true);

    // Animazioni
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const avatarScale = useRef(new Animated.Value(0.8)).current;

    // Fetch dati Steam
    useEffect(() => {
        const fetchPlayerData = async () => {
            if (!steamId) {
                setLoading(false);
                return;
            }

            try {
                // Fetch player summary
                const playerResponse = await fetch(
                    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
                );
                const playerJson = await playerResponse.json();
                const player = playerJson.response?.players?.[0];

                if (player) {
                    setPlayerData(player);
                }

                // Fetch games count
                const gamesResponse = await fetch(
                    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_played_free_games=1`
                );
                const gamesJson = await gamesResponse.json();
                const gamesCount = gamesJson.response?.game_count || 0;

                // Fetch friends count
                const friendsResponse = await fetch(
                    `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`
                );
                const friendsJson = await friendsResponse.json();
                const friendsCount = friendsJson.friendslist?.friends?.length || 0;

                setStats({ games: gamesCount, friends: friendsCount });
            } catch (error) {
                console.error('Error fetching Steam data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerData();
    }, [steamId]);

    // Animazioni
    useEffect(() => {
        if (!loading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(avatarScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [loading]);

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

    const getStatusColor = (state) => {
        switch (state) {
            case 0: return ['#6B7280', '#4B5563'];
            case 1: return ['#4ADE80', '#22C55E'];
            case 2: return ['#3B82F6', '#2563EB'];
            case 3: return ['#F59E0B', '#D97706'];
            case 4: return ['#A855F7', '#9333EA'];
            default: return ['#6B7280', '#4B5563'];
        }
    };

    if (loading || !playerData) {
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
                        <User size={48} color={Colors.accent} />
                    </View>
                    <Text style={{ color: Colors.text, marginTop: 20, fontSize: 16, fontWeight: '600' }}>
                        Caricamento profilo...
                    </Text>
                </LinearGradient>
            </View>
        );
    }

    const statusColors = getStatusColor(playerData.personastate);

    return (
        <View style={{ flex: 1, paddingBottom: 100 }}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0F0A0C', '#22181C', '#1A1216']}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header con Avatar */}
                <Animated.View style={{
                    paddingTop: 70,
                    paddingBottom: 30,
                    alignItems: 'center',
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }}>
                    <Animated.View style={{
                        transform: [{ scale: avatarScale }],
                        marginBottom: 20,
                    }}>
                        <View style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            padding: 4,
                        }}>
                            <LinearGradient
                                colors={statusColors}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 60,
                                    padding: 4,
                                }}
                            >
                                <Image
                                    source={{ uri: playerData.avatarfull }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 56,
                                    }}
                                />
                            </LinearGradient>
                        </View>
                    </Animated.View>

                    <Text style={{
                        color: Colors.text,
                        fontSize: 28,
                        fontWeight: '800',
                        marginBottom: 8,
                        textAlign: 'center',
                    }}>
                        {playerData.personaname}
                    </Text>

                    <View style={{
                        backgroundColor: `${statusColors[0]}33`,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: statusColors[0],
                            marginRight: 8,
                        }} />
                        <Text style={{
                            color: statusColors[0],
                            fontSize: 14,
                            fontWeight: '700',
                        }}>
                            {getStatusText(playerData.personastate)}
                        </Text>
                    </View>
                </Animated.View>

                {/* Stats Cards */}
                <Animated.View style={{
                    flexDirection: 'row',
                    paddingHorizontal: 20,
                    marginBottom: 24,
                    gap: 12,
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }}>
                    <View style={{ flex: 1 }}>
                        <BlurView intensity={30} tint="dark" style={{
                            borderRadius: 20,
                            overflow: 'hidden',
                            backgroundColor: 'rgba(60, 48, 54, 0.4)',
                            borderWidth: 1,
                            borderColor: 'rgba(181, 168, 172, 0.2)',
                        }}>
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <View style={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12,
                                }}>
                                    <Gamepad2 size={24} color="#818CF8" />
                                </View>
                                <Text style={{
                                    color: Colors.text,
                                    fontSize: 24,
                                    fontWeight: '800',
                                    marginBottom: 4,
                                }}>
                                    {stats.games}
                                </Text>
                                <Text style={{
                                    color: Colors.textSecondary,
                                    fontSize: 12,
                                    fontWeight: '600',
                                }}>
                                    Giochi
                                </Text>
                            </View>
                        </BlurView>
                    </View>

                    <View style={{ flex: 1 }}>
                        <BlurView intensity={30} tint="dark" style={{
                            borderRadius: 20,
                            overflow: 'hidden',
                            backgroundColor: 'rgba(60, 48, 54, 0.4)',
                            borderWidth: 1,
                            borderColor: 'rgba(181, 168, 172, 0.2)',
                        }}>
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <View style={{
                                    backgroundColor: 'rgba(74, 222, 128, 0.2)',
                                    width: 48,
                                    height: 48,
                                    borderRadius: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 12,
                                }}>
                                    <Users size={24} color="#4ADE80" />
                                </View>
                                <Text style={{
                                    color: Colors.text,
                                    fontSize: 24,
                                    fontWeight: '800',
                                    marginBottom: 4,
                                }}>
                                    {stats.friends}
                                </Text>
                                <Text style={{
                                    color: Colors.textSecondary,
                                    fontSize: 12,
                                    fontWeight: '600',
                                }}>
                                    Amici
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                </Animated.View>

                {/* Account Info Card */}
                <Animated.View style={{
                    marginHorizontal: 20,
                    marginBottom: 16,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }}>
                    <BlurView intensity={30} tint="dark" style={{
                        borderRadius: 24,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(60, 48, 54, 0.4)',
                        borderWidth: 1,
                        borderColor: 'rgba(181, 168, 172, 0.2)',
                    }}>
                        <View style={{ padding: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <View style={{
                                    backgroundColor: 'rgba(230, 57, 70, 0.2)',
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                }}>
                                    <User size={20} color={Colors.accent} />
                                </View>
                                <Text style={{
                                    color: Colors.text,
                                    fontSize: 20,
                                    fontWeight: '800',
                                }}>
                                    Informazioni Steam
                                </Text>
                            </View>

                            <View style={{ marginBottom: 16 }}>
                                <Text style={{
                                    color: Colors.textSecondary,
                                    fontSize: 13,
                                    marginBottom: 6,
                                    fontWeight: '600',
                                }}>
                                    Steam ID
                                </Text>
                                <Text style={{
                                    color: Colors.text,
                                    fontSize: 15,
                                    fontWeight: '600',
                                }}>
                                    {steamId}
                                </Text>
                            </View>

                            {playerData.realname && (
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{
                                        color: Colors.textSecondary,
                                        fontSize: 13,
                                        marginBottom: 6,
                                        fontWeight: '600',
                                    }}>
                                        Nome reale
                                    </Text>
                                    <Text style={{
                                        color: Colors.text,
                                        fontSize: 15,
                                        fontWeight: '600',
                                    }}>
                                        {playerData.realname}
                                    </Text>
                                </View>
                            )}

                            {playerData.loccountrycode && (
                                <View>
                                    <Text style={{
                                        color: Colors.textSecondary,
                                        fontSize: 13,
                                        marginBottom: 6,
                                        fontWeight: '600',
                                    }}>
                                        Paese
                                    </Text>
                                    <Text style={{
                                        color: Colors.text,
                                        fontSize: 15,
                                        fontWeight: '600',
                                    }}>
                                        {playerData.loccountrycode}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Settings Card */}
                <Animated.View style={{
                    marginHorizontal: 20,
                    marginBottom: 16,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }}>
                    <BlurView intensity={30} tint="dark" style={{
                        borderRadius: 24,
                        overflow: 'hidden',
                        backgroundColor: 'rgba(60, 48, 54, 0.4)',
                        borderWidth: 1,
                        borderColor: 'rgba(181, 168, 172, 0.2)',
                    }}>
                        <View style={{ padding: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                                <View style={{
                                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                }}>
                                    <Text style={{ fontSize: 18 }}>⚙️</Text>
                                </View>
                                <Text style={{
                                    color: Colors.text,
                                    fontSize: 20,
                                    fontWeight: '800',
                                }}>
                                    Impostazioni
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: 'rgba(181, 168, 172, 0.1)',
                            }}>
                                <Bell size={20} color={Colors.textSecondary} />
                                <Text style={{
                                    flex: 1,
                                    color: Colors.text,
                                    fontSize: 15,
                                    fontWeight: '600',
                                    marginLeft: 12,
                                }}>
                                    Notifiche
                                </Text>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: '#475569', true: Colors.accent }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>

                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 16,
                                }}
                                activeOpacity={0.7}
                            >
                                <RefreshCw size={20} color={Colors.textSecondary} />
                                <Text style={{
                                    flex: 1,
                                    color: Colors.text,
                                    fontSize: 15,
                                    fontWeight: '600',
                                    marginLeft: 12,
                                }}>
                                    Sincronizza dati
                                </Text>
                                <ChevronRight size={20} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>

                {/* Logout Button */}
                <Animated.View style={{
                    marginHorizontal: 20,
                    opacity: fadeAnim,
                }}>
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                'Disconnetti Steam',
                                'Vuoi disconnettere il tuo account Steam? Dovrai riconnetterlo per continuare a usare l\'app.',
                                [
                                    { text: 'Annulla', style: 'cancel' },
                                    {
                                        text: 'Disconnetti',
                                        style: 'destructive',
                                        onPress: () => authCtx.logout()
                                    }
                                ]
                            );
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            borderRadius: 20,
                            padding: 18,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                        }}>
                            <LogOut size={20} color={Colors.error} />
                            <Text style={{
                                color: Colors.error,
                                fontSize: 16,
                                fontWeight: '700',
                                marginLeft: 12,
                            }}>
                                Disconnetti account
                            </Text>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

export default Profilo;
