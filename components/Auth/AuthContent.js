import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AuthForm from './AuthForm';
import Button from '../ui/Button';
import FlatButton from '../ui/FlatButton';
import { Colors } from '../../constants/styles';

function AuthContent({ isLogin, onAuthenticate }) {
  const navigation = useNavigation();

  const [credentialsInvalid, setCredentialsInvalid] = useState({
    name: false,
    email: false,
    password: false,
  });

  function switchAuthModeHandler() {
    if (isLogin) {
      navigation.replace('Signup');
    } else {
      navigation.replace('Login');
    }
  }

  function submitHandler(credentials) {
    let { name, email, password } = credentials;

    email = email?.trim() || '';
    password = password?.trim() || '';

    if (!isLogin) {
      name = name?.trim() || '';
    } else {
      name = '';
    }

    const nameIsValid = isLogin || name.length > 1;
    const emailIsValid = email.includes('@');
    const passwordIsValid = password.length > 6;

    if (!nameIsValid || !emailIsValid || !passwordIsValid) {
      setCredentialsInvalid({
        name: !nameIsValid,
        email: !emailIsValid,
        password: !passwordIsValid,
      });
      return;
    }

    onAuthenticate({ name, email, password });
  }

  function handleDemoLogin() {
    submitHandler({
      email: 'test@test.com',
      password: 'test2121',
    });
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        backgroundColor: Colors.primary500,
      }}
    >
      <Text style={{ textAlign: 'center', fontSize: 32, fontWeight: 'bold', color: Colors.text, marginBottom: 8 }}>
        {isLogin ? 'Welcome Back' : 'Register'}
      </Text>
      <Text style={{ textAlign: 'center', fontSize: 16, color: Colors.textSecondary, marginBottom: 24 }}>
        {isLogin ? 'Login to your account' : 'Create your new account'}
      </Text>

      <View
        style={{
          backgroundColor: Colors.surface,
          padding: 24,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          marginBottom: 24,
        }}
      >
        <AuthForm
          isLogin={isLogin}
          onSubmit={submitHandler}
          credentialsInvalid={credentialsInvalid}
        />
      </View>

      <FlatButton>
        <Text style={{ textAlign: 'center', color: Colors.textSecondary, marginBottom: 20 }}>
          Forgot your password?
        </Text>
      </FlatButton>

      {!isLogin && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            <Text style={{ color: Colors.textSecondary, paddingHorizontal: 8, fontSize: 12 }}>
              or continue with
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
            <TouchableOpacity
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: Colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Icon name="google" size={24} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: Colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <Icon name="apple" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
        <Text style={{ color: Colors.textSecondary }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </Text>
        <FlatButton onPress={switchAuthModeHandler}>
          <Text style={{ color: Colors.accentLight, fontWeight: 'bold' }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </Text>
        </FlatButton>
      </View>

      {isLogin && (
        <Button onPress={handleDemoLogin} style={{ backgroundColor: Colors.accent, marginTop: 24 }}>
          <Text style={{ color: Colors.text, fontWeight: 'bold' }}>Try Demo</Text>
        </Button>
      )}
    </View>
  );
}

export default AuthContent;
