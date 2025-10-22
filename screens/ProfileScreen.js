import { useState, useContext } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import {
    User,
    Mail,
    Lock,
    RefreshCw,
    Bell,
    LogOut,
    Calendar,
    ChevronRight,
    CheckCircle,
} from 'lucide-react-native';
import { AuthContext } from '../store/auth-context';

const Profilo = () => {
    const authCtx = useContext(AuthContext);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const accountStatus = 'active';
    const userData = {
        name: 'Mario Rossi',
        email: 'mario@example.com',
        subscriptionEnd: '30/12/2023',
    };

    const getStatusConfig = (status) => {
        const config = {
            active: {
                colors: 'from-green-500 to-green-700',
                text: 'Premium Attivo',
            },
            trial: {
                colors: 'from-yellow-400 to-orange-500',
                text: 'Periodo di Prova',
            },
            suspended: {
                colors: 'from-red-500 to-red-700',
                text: 'Account Sospeso',
            },
        };
        return (
            config[status] || {
                colors: 'from-gray-500 to-gray-700',
                text: 'Stato Sconosciuto',
            }
        );
    };

    const statusConfig = getStatusConfig(accountStatus);

    return (
        <View className="flex-1 bg-primary500">
            <ScrollView
                className="flex-1 px-5"
                contentContainerClassName="pb-24"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View className="items-center mb-8 mt-8">
                    <View className="w-28 h-28 rounded-full mb-4 overflow-hidden shadow-lg bg-gradient-to-br from-accent to-accentLight justify-center items-center">
                        <Text className="text-4xl font-bold text-text">
                            {userData.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                        </Text>
                    </View>
                    <Text className="text-3xl font-bold text-text mb-1">Profilo</Text>
                    <Text className="text-base text-textSecondary">
                        Gestisci il tuo account
                    </Text>
                </View>

                {/* Stato Account */}
                <View className="mb-8">
                    <View
                        className={`flex-row items-center self-center px-5 py-2.5 rounded-full shadow-md bg-gradient-to-r ${statusConfig.colors}`}
                    >
                        <CheckCircle size={20} color="white" />
                        <Text className="text-white font-semibold text-sm ml-2">
                            {statusConfig.text}
                        </Text>
                    </View>
                </View>

                {/* Card Dettagli Personali */}
                <View className="bg-surface rounded-2xl p-5 mb-6 shadow-lg">
                    <View className="flex-row items-center mb-5 border-b border-border pb-4">
                        <User size={22} color="#E63946" />
                        <Text className="text-lg font-semibold text-text ml-2.5">
                            Dettagli Personali
                        </Text>
                    </View>

                    <View className="flex-row mb-4">
                        <View className="w-10 justify-center items-center">
                            <User size={18} color="#94A3B8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-textSecondary text-sm mb-0.5">
                                Nome completo
                            </Text>
                            <Text className="text-text font-medium text-base">
                                {userData.name}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row">
                        <View className="w-10 justify-center items-center">
                            <Mail size={18} color="#94A3B8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-textSecondary text-sm mb-0.5">Email</Text>
                            <Text className="text-text font-medium text-base">
                                {userData.email}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity className="flex-row items-center justify-center py-3 rounded-xl bg-accent/10 mt-6 active:bg-accent/20">
                        <Text className="text-accentLight font-semibold mr-1">
                            Modifica profilo
                        </Text>
                        <ChevronRight size={16} color="#FF7B89" />
                    </TouchableOpacity>
                </View>

                {/* Card Abbonamento */}
                <View className="bg-surface rounded-2xl p-5 mb-6 shadow-lg">
                    <View className="flex-row items-center mb-5 border-b border-border pb-4">
                        <View className="bg-accent/20 px-2 py-1 rounded">
                            <Text className="text-accent font-bold text-xs">PRO</Text>
                        </View>
                        <Text className="text-lg font-semibold text-text ml-2.5">
                            Abbonamento
                        </Text>
                    </View>

                    <View className="flex-row items-center mb-5">
                        <Calendar size={20} color="#94A3B8" />
                        <Text className="text-textSecondary ml-2.5 text-sm">
                            Scadenza:{' '}
                            <Text className="text-text font-medium">
                                {userData.subscriptionEnd}
                            </Text>
                        </Text>
                    </View>

                    <TouchableOpacity className="flex-row items-center justify-center bg-accent py-4 rounded-xl shadow-lg active:opacity-80">
                        <Text className="text-text font-bold text-base mr-2">
                            Gestisci abbonamento
                        </Text>
                        <ChevronRight size={16} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Card Impostazioni */}
                <View className="bg-surface rounded-2xl p-5 mb-6 shadow-lg">
                    <View className="flex-row items-center mb-5 border-b border-border pb-4">
                        <View className="w-6 h-6 bg-accent/20 rounded-full items-center justify-center">
                            <Text className="text-accent text-xs">⚙️</Text>
                        </View>
                        <Text className="text-lg font-semibold text-text ml-2.5">
                            Impostazioni
                        </Text>
                    </View>

                    <TouchableOpacity className="flex-row items-center py-4 border-b border-border active:bg-accent/5 rounded-lg px-2">
                        <View className="w-10">
                            <Lock size={18} color="#94A3B8" />
                        </View>
                        <Text className="flex-1 text-text text-base">
                            Modifica password
                        </Text>
                        <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center py-4 border-b border-border active:bg-accent/5 rounded-lg px-2">
                        <View className="w-10">
                            <RefreshCw size={18} color="#94A3B8" />
                        </View>
                        <Text className="flex-1 text-text text-base">
                            Sincronizzazione forzata
                        </Text>
                        <ChevronRight size={16} color="#94A3B8" />
                    </TouchableOpacity>

                    <View className="flex-row items-center py-4 px-2">
                        <View className="w-10">
                            <Bell size={18} color="#94A3B8" />
                        </View>
                        <Text className="flex-1 text-text text-base">Notifiche</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#475569', true: '#E63946' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Logout */}
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
                                    onPress: () => authCtx.disconnectSteam()
                                }
                            ]
                        );
                    }}
                    className="flex-row items-center justify-center p-4 rounded-xl bg-error/10 active:bg-error/20 mt-2.5"
                >
                    <LogOut size={18} color="#EF4444" />
                    <Text className="text-error font-semibold ml-2.5">
                        Esci dall'account
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default Profilo;
