import { View, Button, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../store/auth-context';
import { useNavigation } from '@react-navigation/native';

WebBrowser.maybeCompleteAuthSession();

export default function HomePage() {
  const authCtx = useContext(AuthContext);
  const navigation = useNavigation();

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const steamAuthUrl = `https://steamcommunity.com/openid/login?` +
    `openid.ns=http://specs.openid.net/auth/2.0&` +
    `openid.mode=checkid_setup&` +
    `openid.return_to=${encodeURIComponent(redirectUri)}&` +
    `openid.realm=${encodeURIComponent(redirectUri)}&` +
    `openid.identity=http://specs.openid.net/auth/2.0/identifier_select&` +
    `openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select`;

  const [request, response, promptAsync] = useAuthRequest(
    { redirectUri },
    { authorizationEndpoint: steamAuthUrl }
  );

  const steamLogin = () => {
    promptAsync({ useProxy: true });
  };

  // Redirect automatico se login completato
  useEffect(() => {
    if (response?.type === 'success') {
      const url = response.params?.claimed_id;
      const steamId = url?.split('/').pop();
      authCtx.authenticate('steam-token', steamId);
      navigation.replace('Friends'); // ← redirect automatico
    }
  }, [response]);

  // Redirect automatico se già loggato
  useEffect(() => {
    if (authCtx.steamId) {
      navigation.replace('Friends');
    }
  }, [authCtx.steamId]);

  return (
    <View className="flex-1 justify-center items-center bg-gray-900 p-4">
      <Text className="text-white text-2xl mb-5">Login with Steam</Text>
      <Button title="Login with Steam" onPress={steamLogin} />
    </View>
  );
}
