import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Switch } from 'react-native';
import { User, Mail, Lock, RefreshCw, Bell, LogOut, Calendar, ChevronRight, CheckCircle } from 'lucide-react-native';

const Profilo = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const accountStatus = 'active';
    const userData = {
        name: 'Mario Rossi',
        email: 'mario@example.com',
        subscriptionEnd: '30/12/2023'
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
            }
        };
        return config[status] || {
            colors: 'from-gray-500 to-gray-700',
            text: 'Stato Sconosciuto',
        };
    };

    const statusConfig = getStatusConfig(accountStatus);

    return (
        <View className="flex-1 bg-gray-900">
            <ScrollView
                className="flex-1 px-5"
                contentContainerClassName="pb-24"
                showsVerticalScrollIndicator={false}
            >
                {/* Header con avatar */}
                <View className="items-center mb-8 mt-3">
                    <View className="w-24 h-24 rounded-full mb-4 overflow-hidden shadow-lg">
                        <View className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 justify-center items-center">
                            <Text className="text-4xl font-bold text-white">
                                {userData.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-3xl font-bold text-white mb-1">Profilo</Text>
                    <Text className="text-base text-gray-400">Gestisci il tuo account</Text>
                </View>

                {/* Badge Stato Account */}
                <View className="mb-6">
                    <View className={`flex-row items-center self-center px-5 py-2.5 rounded-full shadow-md bg-gradient-to-r ${statusConfig.colors}`}>
                        <CheckCircle size={20} color="white" />
                        <Text className="text-white font-semibold text-sm ml-2">
                            {statusConfig.text}
                        </Text>
                    </View>
                </View>

                {/* Card Dettagli Personali */}
                <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-lg">
                    <View className="flex-row items-center mb-5 border-b border-gray-700 pb-4">
                        <User size={22} color="#2ECC71" />
                        <Text className="text-lg font-semibold text-white ml-2.5">
                            Dettagli Personali
                        </Text>
                    </View>

                    <View className="flex-row mb-5">
                        <View className="w-10">
                            <User size={18} color="#9CA3AF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-400 text-sm mb-0.5">Nome completo</Text>
                            <Text className="text-white font-medium text-base">{userData.name}</Text>
                        </View>
                    </View>

                    <View className="flex-row mb-5">
                        <View className="w-10">
                            <Mail size={18} color="#9CA3AF" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-400 text-sm mb-0.5">Email</Text>
                            <Text className="text-white font-medium text-base">{userData.email}</Text>
                        </View>
                    </View>

                    <TouchableOpacity className="flex-row items-center justify-center py-3 rounded-xl bg-green-500/10 mt-2.5">
                        <Text className="text-green-500 font-semibold mr-1">Modifica profilo</Text>
                        <ChevronRight size={16} color="#2ECC71" />
                    </TouchableOpacity>
                </View>

                {/* Card Abbonamento */}
                <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-lg">
                    <View className="flex-row items-center mb-5 border-b border-gray-700 pb-4">
                        <View className="bg-green-500/20 p-1 rounded">
                            <Text className="text-green-500 font-bold text-xs">PRO</Text>
                        </View>
                        <Text className="text-lg font-semibold text-white ml-2.5">
                            Abbonamento
                        </Text>
                    </View>

                    <View className="flex-row items-center mb-5">
                        <Calendar size={20} color="#9CA3AF" />
                        <Text className="text-gray-400 ml-2.5 text-sm">
                            Scadenza: <Text className="text-white font-medium">{userData.subscriptionEnd}</Text>
                        </Text>
                    </View>

                    <TouchableOpacity className="flex-row items-center justify-center bg-green-500 py-4 rounded-xl shadow-lg">
                        <Text className="text-white font-bold text-base mr-2">
                            Gestisci abbonamento
                        </Text>
                        <ChevronRight size={16} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Card Impostazioni */}
                <View className="bg-gray-800 rounded-2xl p-5 mb-5 shadow-lg">
                    <View className="flex-row items-center mb-5 border-b border-gray-700 pb-4">
                        <View className="w-6 h-6 bg-gray-700 rounded-full items-center justify-center">
                            <Text className="text-white text-xs">⚙️</Text>
                        </View>
                        <Text className="text-lg font-semibold text-white ml-2.5">
                            Impostazioni
                        </Text>
                    </View>

                    <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-700">
                        <View className="w-10">
                            <Lock size={18} color="#9CA3AF" />
                        </View>
                        <Text className="flex-1 text-white text-base">Modifica password</Text>
                        <ChevronRight size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center py-4 border-b border-gray-700">
                        <View className="w-10">
                            <RefreshCw size={18} color="#9CA3AF" />
                        </View>
                        <Text className="flex-1 text-white text-base">Sincronizzazione forzata</Text>
                        <ChevronRight size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <View className="flex-row items-center py-4 border-b border-gray-700">
                        <View className="w-10">
                            <Bell size={18} color="#9CA3AF" />
                        </View>
                        <Text className="flex-1 text-white text-base">Notifiche</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#4B5563', true: '#2ECC71' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity className="flex-row items-center justify-center p-4 rounded-xl bg-red-500/10 mt-2.5">
                    <LogOut size={18} color="#EF4444" />
                    <Text className="text-red-500 font-semibold ml-2.5">
                        Esci dall'account
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default Profilo;