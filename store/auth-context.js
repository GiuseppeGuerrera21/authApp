import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
    token: null,
    steamId: null,
    isAuthenticated: false,
    isLoading: true,
    authenticate: (token, steamId) => { },
    logout: () => { },
    disconnectSteam: () => { }
});

function AuthContextProvider({ children }) {
    const [authToken, setAuthToken] = useState(null);
    const [steamId, setSteamId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStoredAuth() {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                const storedSteamId = await AsyncStorage.getItem('steamId');
                if (storedToken) {
                    setAuthToken(storedToken);
                }
                if (storedSteamId) {
                    setSteamId(storedSteamId);
                }
            } catch (err) {
                console.log('Error loading stored auth:', err);
            } finally {
                setIsLoading(false);
            }
        }

        loadStoredAuth();
    }, []);

    async function authenticate(token, steamIdParam = null) {
        try {
            console.log('🔐 authenticate() chiamata con:', { token: !!token, steamId: steamIdParam });
            setAuthToken(token);

            // Aggiorna steamId: se undefined mantieni il valore corrente, se null rimuovilo, altrimenti impostalo
            if (steamIdParam === null) {
                console.log('🗑️ Rimozione steamId...');
                setSteamId(null);
                await AsyncStorage.removeItem('steamId');
            } else if (steamIdParam !== undefined) {
                console.log('💾 Impostando steamId:', steamIdParam);
                setSteamId(steamIdParam);
                await AsyncStorage.setItem('steamId', steamIdParam);
            }

            await AsyncStorage.setItem('token', token);
            console.log('✅ Auth aggiornata');
        } catch (err) {
            console.log('❌ Error storing auth:', err);
        }
    }

    async function logout() {
        try {
            console.log('🚪 Logout completo (email + Steam)...');
            setAuthToken(null);
            setSteamId(null);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('steamId');
            console.log('✅ Logout completato');
        } catch (err) {
            console.log('❌ Error clearing auth:', err);
        }
    }

    async function disconnectSteam() {
        try {
            console.log('🔌 Disconnessione solo Steam...');
            setSteamId(null);
            await AsyncStorage.removeItem('steamId');
            console.log('✅ Steam disconnesso');
        } catch (err) {
            console.log('❌ Error disconnecting Steam:', err);
        }
    }

    const value = {
        token: authToken,
        steamId,
        isAuthenticated: !!authToken,
        isLoading,
        authenticate,
        logout,
        disconnectSteam
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;
