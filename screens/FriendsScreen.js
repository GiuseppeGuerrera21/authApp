import { View, Text, FlatList, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../store/auth-context';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

export default function FriendsScreen() {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

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

    const onRefresh = () => {
        setRefreshing(true);
        fetchFriends();
    };

    const getStatusColor = (state) => {
        switch (state) {
            case 0: return 'text-red-500';
            case 1: return 'text-green-500';
            case 2: return 'text-blue-500';
            case 3: return 'text-orange-500';
            case 4: return 'text-purple-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusBgColor = (state) => {
        switch (state) {
            case 0: return 'bg-red-500';
            case 1: return 'bg-green-500';
            case 2: return 'bg-blue-500';
            case 3: return 'bg-orange-500';
            case 4: return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
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
            <View className="flex-1 justify-center items-center bg-gray-900">
                <ActivityIndicator size="large" color="#00aced" />
                <Text className="text-white mt-4 text-base">Caricamento amici...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-900 px-5">
                <Text className="text-6xl mb-5">⚠️</Text>
                <Text className="text-red-500 text-base text-center mb-5">{error}</Text>
                <TouchableOpacity
                    className="bg-[#00aced] py-3 px-8 rounded-lg"
                    onPress={fetchFriends}
                >
                    <Text className="text-white font-bold">Riprova</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (friends.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-900 px-5">
                <Text className="text-6xl mb-5">👥</Text>
                <Text className="text-white text-xl font-bold mb-2">Nessun amico trovato</Text>
                <Text className="text-gray-400 text-sm text-center">
                    Il profilo potrebbe essere privato
                </Text>
            </View>
        );
    }

    const onlineFriends = friends.filter(f => f.personastate > 0).length;

    return (
        <View className="flex-1 bg-gray-900">
            <View className="pt-14 pb-5 px-5 bg-gray-800 border-b border-gray-700">
                <Text className="text-white text-3xl font-bold mb-1">I tuoi amici</Text>
                <Text className="text-gray-400 text-sm">
                    {friends.length} amici • {onlineFriends} online
                </Text>
            </View>

            <FlatList
                data={friends}
                keyExtractor={(item) => item.steamid}
                renderItem={({ item }) => (
                    <View className="flex-row items-center mb-3 bg-gray-800 p-3.5 rounded-xl mx-4">
                        <View className="relative">
                            <Image
                                source={{ uri: item.avatarfull }}
                                className="w-15 h-15 rounded-full border-2 border-gray-700"
                                style={{ width: 60, height: 60 }}
                            />
                            {item.personastate > 0 && (
                                <View className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-800 ${getStatusBgColor(item.personastate)}`} />
                            )}
                        </View>

                        <View className="flex-1 ml-4">
                            <Text className="text-white text-base font-bold" numberOfLines={1}>
                                {item.personaname}
                            </Text>
                            <Text className={`text-sm mt-1 ${getStatusColor(item.personastate)}`}>
                                {getStatusText(item.personastate)}
                            </Text>
                            {item.gameextrainfo && (
                                <Text className="text-gray-400 text-xs mt-1 italic" numberOfLines={1}>
                                    🎮 {item.gameextrainfo}
                                </Text>
                            )}
                        </View>
                    </View>
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#00aced"
                        colors={["#00aced"]}
                    />
                }
                contentContainerStyle={{ paddingVertical: 16 }}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}