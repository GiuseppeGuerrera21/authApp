import { View, TouchableOpacity, Animated, StyleSheet, Dimensions, Text } from 'react-native';
import { useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/styles';

const { width } = Dimensions.get('window');
const BUTTON_WIDTH = width / 4;

export default function CustomTabBar({ state, descriptors, navigation }) {
    const slideAnim = useRef(new Animated.Value(state.index * BUTTON_WIDTH)).current;
    const scaleAnims = useRef(state.routes.map((_, index) => new Animated.Value(index === state.index ? 1.15 : 1))).current;
    const opacityAnims = useRef(state.routes.map((_, index) => new Animated.Value(index === state.index ? 1 : 0.7))).current;
    const translateYAnims = useRef(state.routes.map((_, index) => new Animated.Value(index === state.index ? -35 : 0))).current;

    useEffect(() => {
        // Anima lo slide dell'indicatore
        Animated.spring(slideAnim, {
            toValue: state.index * BUTTON_WIDTH,
            tension: 80,
            friction: 10,
            useNativeDriver: true,
        }).start();

        // Anima scale e opacity per tutti i tab
        state.routes.forEach((route, index) => {
            if (index === state.index) {
                // Tab attivo - sporge dalla tab bar
                Animated.parallel([
                    Animated.spring(scaleAnims[index], {
                        toValue: 1.15,
                        tension: 80,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnims[index], {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateYAnims[index], {
                        toValue: -35,
                        tension: 80,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                ]).start();
            } else {
                // Tab inattivi - dimensione normale
                Animated.parallel([
                    Animated.spring(scaleAnims[index], {
                        toValue: 1,
                        tension: 80,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnims[index], {
                        toValue: 0.7,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.spring(translateYAnims[index], {
                        toValue: 0,
                        tension: 80,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        });
    }, [state.index]);

    const getIconName = (routeName, focused) => {
        const icons = {
            Friends: focused ? 'people' : 'people-outline',
            Games: focused ? 'game-controller' : 'game-controller-outline',
            Achievements: focused ? 'trophy' : 'trophy-outline',
            Profile: focused ? 'person' : 'person-outline',
        };
        return icons[routeName] || 'ellipse';
    };

    return (
        <View style={styles.container}>
            {/* Bottoni che sporgono */}
            <View style={styles.floatingContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    if (!isFocused) return <View key={route.key} style={{ flex: 1 }} />;

                    return (
                        <View key={route.key} style={[styles.floatingTab, { left: index * BUTTON_WIDTH }]}>
                            <Animated.View
                                style={[
                                    styles.floatingButton,
                                    {
                                        transform: [
                                            { scale: scaleAnims[index] },
                                            { translateY: translateYAnims[index] },
                                        ],
                                        opacity: opacityAnims[index],
                                    },
                                ]}
                            >
                                <View style={styles.activeBackground}>
                                    <LinearGradient
                                        colors={[Colors.accent, Colors.accentLight]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.activeGradient}
                                    />
                                </View>
                                <Ionicons
                                    name={getIconName(route.name, true)}
                                    size={28}
                                    color="#FFFFFF"
                                />
                            </Animated.View>
                        </View>
                    );
                })}
            </View>

            {/* Sfondo con glassmorphism */}
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                <LinearGradient
                    colors={['rgba(34, 24, 28, 0.98)', 'rgba(15, 10, 12, 0.98)']}
                    style={styles.gradient}
                >
                    {/* Bottoni */}
                    <View style={styles.tabsContainer}>
                        {state.routes.map((route, index) => {
                            const { options } = descriptors[route.key];
                            const label = options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                ? options.title
                                : route.name;

                            const isFocused = state.index === index;

                            const onPress = () => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });

                                if (!isFocused && !event.defaultPrevented) {
                                    navigation.navigate(route.name);
                                }
                            };

                            const onLongPress = () => {
                                navigation.emit({
                                    type: 'tabLongPress',
                                    target: route.key,
                                });
                            };

                            return (
                                <TouchableOpacity
                                    key={route.key}
                                    accessibilityRole="button"
                                    accessibilityState={isFocused ? { selected: true } : {}}
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    testID={options.tabBarTestID}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    style={styles.tab}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.buttonContainer}>
                                        {!isFocused && (
                                            <View style={styles.inactiveButton}>
                                                <Ionicons
                                                    name={getIconName(route.name, false)}
                                                    size={24}
                                                    color={Colors.textSecondary}
                                                />
                                                <Text
                                                    style={[
                                                        styles.label,
                                                        {
                                                            color: Colors.textSecondary,
                                                            fontWeight: '600',
                                                        },
                                                    ]}
                                                >
                                                    {label}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </LinearGradient>
            </BlurView>

            {/* Ombra sopra */}
            <LinearGradient
                colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.15)']}
                style={styles.topShadow}
                pointerEvents="none"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 95,
    },
    floatingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 95,
        flexDirection: 'row',
        zIndex: 10,
        pointerEvents: 'none',
    },
    floatingTab: {
        position: 'absolute',
        width: BUTTON_WIDTH,
        height: 95,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    floatingButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 65,
        height: 65,
        borderRadius: 33,
        shadowColor: '#E63946',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
    },
    blurContainer: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        paddingBottom: 28,
        paddingTop: 12,
    },
    tabsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
    },
    inactiveButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 28,
        overflow: 'hidden',
    },
    activeGradient: {
        flex: 1,
    },
    label: {
        fontSize: 11,
        marginTop: 6,
        fontWeight: '600',
    },
    topShadow: {
        position: 'absolute',
        top: -10,
        left: 0,
        right: 0,
        height: 10,
    },
});
