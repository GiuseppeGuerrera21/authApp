import { View, Text, FlatList, Image, ActivityIndicator } from 'react-native';
import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../store/auth-context';

const STEAM_API_KEY = 'BC6FE6C9ECC75A20AE247FA48DF33F9C';

export default function FriendsPage() {
    const authCtx = useContext(AuthContext);
    const steamId = authCtx.steamId;
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!steamId) return;

        const fetchFriends = async () => {
            try {
                const friendsResponse = await fetch(
                    `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&relationship=friend`
                );
                const friendsData = await friendsResponse.json();
                const friendIds = friendsData.friendslist?.friends?.map(f => f.steamid) || [];

                if (friendIds.length === 0) {
                    setFriends([]);
                    setLoading(false);
                    return;
                }

                const playersResponse = await fetch(
                    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${friendIds.join(',')}`
                );
                const playersData = await playersResponse.json();
                setFriends(playersData.response.players);
                setLoading(false);
            } catch (err) {
                console.log('Errore fetch amici Steam:', err);
                setLoading(false);
            }
        };

        fetchFriends();
    }, [steamId]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-900">
                <ActivityIndicator size="large" color="#00aced" />
                <Text className="text-white mt-2">Caricamento amici...</Text>
            </View>
        );
    }

    if (friends.length === 0) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-900">
                <Text className="text-white">Nessun amico trovato.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900 p-4">
            <FlatList
                data={friends}
                keyExtractor={(item) => item.steamid}
                renderItem={({ item }) => (
                    <View className="flex-row items-center mb-3 bg-gray-800 p-3 rounded-lg">
                        <Image
                            source={{ uri: item.avatarfull }}
                            className="w-12 h-12 rounded-full mr-3"
                        />
                        <View>
                            <Text className="text-white text-lg font-bold">{item.personaname}</Text>
                            <Text className="text-gray-400 text-sm">
                                {item.personastate === 0
                                    ? 'Offline'
                                    : item.personastate === 1
                                        ? 'Online'
                                        : 'Occupato/In-game'}
                            </Text>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}
