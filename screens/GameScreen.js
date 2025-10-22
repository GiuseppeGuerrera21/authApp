import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../store/auth-context';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

export default function GameScreen() {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [totalPlaytime, setTotalPlaytime] = useState(0);

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

    if (games.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-[#22181C] px-5">
                <Text className="text-6xl mb-5">🎮</Text>
                <Text className="text-text text-xl font-bold mb-2">Nessun gioco trovato</Text>
                <Text className="text-slate-400 text-sm text-center">
                    Non hai ancora giochi su Steam o il profilo potrebbe essere privato
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#22181C]">
            <View className="pt-14 pb-5 px-5 bg-slate-800 border-b border-slate-700">
                <Text className="text-text text-3xl font-bold mb-1">I tuoi giochi</Text>
                <Text className="text-slate-400 text-sm">
                    {games.length} giochi • {formatPlaytime(totalPlaytime)} totali
                </Text>
            </View>

            <FlatList
                data={games}
                keyExtractor={(item) => item.appid.toString()}
                renderItem={({ item }) => (
                    <View className="flex-row items-center mb-3 bg-slate-800 p-3.5 rounded-xl mx-4 shadow-lg">
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
                                ⏱️ {formatPlaytime(item.playtime_forever || 0)}
                            </Text>
                            {item.playtime_2weeks > 0 && (
                                <Text className="text-green-500 text-xs mt-1">
                                    🎯 {formatPlaytime(item.playtime_2weeks)} nelle ultime 2 settimane
                                </Text>
                            )}
                        </View>
                    </View>
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
