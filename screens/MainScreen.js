import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation }) => {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <StatusBar barStyle="light-content" backgroundColor="#2D2328" />
            {/* Main Content */}
            <View className="flex-1 justify-center px-8">
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                    className="items-center"
                >
                    {/* Icon Container */}
                    <View className="w-24 h-24 bg-accent rounded-2xl justify-center items-center mb-6 shadow-lg shadow-accent/30">
                        <Ionicons name="rocket" size={40} color="#F1F1F1" />
                    </View>

                    {/* Text Content */}
                    <Text className="text-5xl font-black text-text text-center mb-3">
                        Benvenuto
                    </Text>
                    <Text className="text-xl text-textSecondary text-center mb-12 leading-7">
                        Scopri un'esperienza{'\n'}
                        straordinaria
                    </Text>

                    {/* Stats Row */}
                    <View className="flex-row justify-around w-full mb-12">
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-accent">10K+</Text>
                            <Text className="text-textSecondary text-sm">Utenti</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-accent">4.8</Text>
                            <Text className="text-textSecondary text-sm">Rating</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-2xl font-bold text-accent">99%</Text>
                            <Text className="text-textSecondary text-sm">Soddisfazione</Text>
                        </View>
                    </View>
                </Animated.View>
            </View>

            {/* Action Buttons */}
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
                className="px-8 pb-8"
            >
                {/* Primary Button */}
                <TouchableOpacity
                    className="bg-accent rounded-2xl py-5 mb-4 flex-row justify-center items-center shadow-lg shadow-accent/25"
                    onPress={() => navigation.navigate('Login')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-in" size={20} color="#F1F1F1" />
                    <Text className="text-text text-lg font-semibold ml-2">
                        Accedi al tuo account
                    </Text>
                </TouchableOpacity>

                {/* Secondary Button */}
                <TouchableOpacity
                    className="border-2 border-border rounded-2xl py-5 flex-row justify-center items-center"
                    onPress={() => navigation.navigate('Signup')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="person-add" size={20} color="#F1F1F1" />
                    <Text className="text-text text-lg font-semibold ml-2">
                        Crea nuovo account
                    </Text>
                </TouchableOpacity>

                {/* Quick Access */}
                <View className="flex-row justify-center mt-6">
                    <TouchableOpacity className="mx-2">
                        <Ionicons name="finger-print" size={24} color="#FF7B89" />
                    </TouchableOpacity>
                    <TouchableOpacity className="mx-2">
                        <Ionicons name="person" size={24} color="#FF7B89" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};

export default WelcomeScreen;