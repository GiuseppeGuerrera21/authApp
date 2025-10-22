import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../store/auth-context';

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
            <View className="flex-1 justify-center items-center bg-[#22181C]">
                <ActivityIndicator size="large" color="#DBEAFE" />
                <Text className="text-text mt-4 text-base">Caricamento giochi...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-[#22181C] px-5">
                <Text className="text-6xl mb-5">⚠️</Text>
                <Text className="text-error text-base text-center mb-5">{error}</Text>
                <TouchableOpacity
                    className="bg-primary700 py-3 px-8 rounded-lg"
                    onPress={fetchGames}
                >
                    <Text className="text-primary100 font-bold">Riprova</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Se non è selezionato nessun gioco, mostra la lista
    if (!selectedGame) {
        if (games.length === 0) {
            return (
                <View className="flex-1 justify-center items-center bg-[#22181C] px-5">
                    <Text className="text-6xl mb-5">🏆</Text>
                    <Text className="text-text text-xl font-bold mb-2">Nessun gioco trovato</Text>
                    <Text className="text-slate-400 text-sm text-center">
                        Gioca ad alcuni giochi per vedere i trofei!
                    </Text>
                </View>
            );
        }

        return (
            <View className="flex-1 bg-#22181C">
                <View className="pt-14 pb-5 px-5 bg-slate-800 border-b border-slate-700">
                    <Text className="text-text text-3xl font-bold mb-1">Trofei Steam</Text>
                    <Text className="text-slate-400 text-sm">
                        Seleziona un gioco per vedere i trofei
                    </Text>
                </View>

                <FlatList
                    data={games}
                    keyExtractor={(item) => item.appid.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => fetchAchievements(item.appid, item.name)}
                            className="flex-row items-center mb-3 bg-slate-800 p-3.5 rounded-xl mx-4 shadow-lg"
                        >
                            <View className="relative">
                                {item.img_icon_url ? (
                                    <Image
                                        source={{ uri: getImageUrl(item.appid, item.img_icon_url) }}
                                        className="w-15 h-15 rounded-lg border-2 border-primary700/20"
                                        style={{ width: 60, height: 60 }}
                                    />
                                ) : (
                                    <View className="w-15 h-15 rounded-lg border-2 border-primary700/20 bg-slate-700 justify-center items-center" style={{ width: 60, height: 60 }}>
                                        <Text className="text-3xl">🎮</Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-1 ml-4">
                                <Text className="text-text text-base font-bold" numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className="text-slate-400 text-sm mt-1">
                                    Tocca per vedere i trofei
                                </Text>
                            </View>

                            <Text className="text-slate-500 text-2xl">›</Text>
                        </TouchableOpacity>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#DBEAFE"
                            colors={["#DBEAFE"]}
                        />
                    }
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        );
    }

    // Vista degli achievements per il gioco selezionato
    return (
        <View className="flex-1 bg-gray-900">
            <View className="pt-14 pb-5 px-5 bg-gray-800 border-b border-gray-700">
                <TouchableOpacity
                    onPress={() => {
                        setSelectedGame(null);
                        setAchievements([]);
                    }}
                    className="flex-row items-center mb-3"
                >
                    <Text className="text-[#00aced] text-base mr-2">‹ Indietro</Text>
                </TouchableOpacity>
                <Text className="text-white text-2xl font-bold mb-1" numberOfLines={1}>
                    {selectedGame.name}
                </Text>
                {!loadingAchievements && stats.total > 0 && (
                    <View className="flex-row items-center mt-2">
                        <View className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden mr-3">
                            <View
                                className="h-full bg-green-500"
                                style={{ width: `${stats.percentage}%` }}
                            />
                        </View>
                        <Text className="text-gray-400 text-sm">
                            {stats.unlocked}/{stats.total} ({stats.percentage}%)
                        </Text>
                    </View>
                )}
            </View>

            {loadingAchievements ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#00aced" />
                    <Text className="text-white mt-4 text-base">Caricamento trofei...</Text>
                </View>
            ) : achievements.length === 0 ? (
                <View className="flex-1 justify-center items-center px-5">
                    <Text className="text-6xl mb-5">🏆</Text>
                    <Text className="text-white text-xl font-bold mb-2">Nessun trofeo disponibile</Text>
                    <Text className="text-gray-400 text-sm text-center">
                        Questo gioco non ha trofei o il profilo è privato
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={achievements}
                    keyExtractor={(item) => item.apiname}
                    renderItem={({ item }) => (
                        <View className={`flex-row items-center mb-3 p-3.5 rounded-xl mx-4 ${item.achieved ? 'bg-gray-800' : 'bg-gray-800/50'}`}>
                            <View className="relative">
                                <Image
                                    source={{ uri: item.achieved ? item.icon : item.iconGray }}
                                    className="w-14 h-14 rounded-lg"
                                    style={{ width: 56, height: 56 }}
                                />
                                {item.achieved && (
                                    <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
                                        <Text className="text-white text-xs font-bold">✓</Text>
                                    </View>
                                )}
                            </View>

                            <View className="flex-1 ml-4">
                                <Text className={`text-base font-bold ${item.achieved ? 'text-white' : 'text-gray-500'}`} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text className={`text-sm mt-1 ${item.achieved ? 'text-gray-400' : 'text-gray-600'}`} numberOfLines={2}>
                                    {item.description}
                                </Text>
                                {item.achieved && item.unlocktime > 0 && (
                                    <Text className="text-green-500 text-xs mt-1">
                                        🎉 Sbloccato il {formatDate(item.unlocktime)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
