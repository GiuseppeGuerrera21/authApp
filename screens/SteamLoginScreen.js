import { useContext } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AuthContext } from '../store/auth-context';

WebBrowser.maybeCompleteAuthSession();

export default function SteamLoginScreen({ navigation }) {
    const authCtx = useContext(AuthContext);

    const steamLogin = async () => {
        try {
            const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
            const steamAuthUrl =
                `https://steamcommunity.com/openid/login?` +
                `openid.ns=http://specs.openid.net/auth/2.0&` +
                `openid.mode=checkid_setup&` +
                `openid.return_to=${encodeURIComponent(redirectUri)}&` +
                `openid.realm=${encodeURIComponent(redirectUri)}&` +
                `openid.identity=http://specs.openid.net/auth/2.0/identifier_select&` +
                `openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;

            const result = await AuthSession.startAsync({ authUrl: steamAuthUrl }); // startAsync or promptAsync both funzionano con expo

            // result.type === 'success' quando l'utente completa il flusso
            if (result.type === 'success') {
                // steam ritorna l'openid.claimed_id nella query, controlliamo possibili nomi
                const params = result.params || {};
                const claimed = params['openid.claimed_id'] || params.claimed_id || params.openid_claimed_id;

                if (!claimed) {
                    Alert.alert('Login Steam fallito', 'Impossibile recuperare l\'ID Steam.');
                    return;
                }

                const steamId = claimed.split('/').pop();
                // salva nel context (usa un token placeholder o un token tuo)
                authCtx.authenticate('steam-token', steamId);

                // naviga alla Welcome screen (o torna indietro)
                navigation.replace('Welcome');
            } else if (result.type === 'dismiss' || result.type === 'cancel') {
                // l'utente ha annullato
            } else {
                console.log('Steam auth result:', result);
            }
        } catch (err) {
            console.log('Steam login error:', err);
            Alert.alert('Errore', 'Si è verificato un errore durante il login con Steam.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login con Steam</Text>
            <Button title="Accedi con Steam" onPress={steamLogin} />
            <View style={{ height: 12 }} />
            <Button title="Torna indietro" onPress={() => navigation.goBack()} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
    title: { fontSize: 20, marginBottom: 12 }
});
