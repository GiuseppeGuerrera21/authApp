import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({
    token: null,
    steamId: null,
    isAuthenticated: false,
    isLoading: true,
    authenticate: (token, steamId) => { },
    logout: () => { }
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
            setAuthToken(token);
            if (steamIdParam) setSteamId(steamIdParam);
            await AsyncStorage.setItem('token', token);
            if (steamIdParam) await AsyncStorage.setItem('steamId', steamIdParam);
        } catch (err) {
            console.log('Error storing auth:', err);
        }
    }

    async function logout() {
        try {
            setAuthToken(null);
            setSteamId(null);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('steamId');
        } catch (err) {
            console.log('Error clearing auth:', err);
        }
    }

    const value = {
        token: authToken,
        steamId,
        isAuthenticated: !!authToken,
        isLoading,
        authenticate,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContextProvider;
