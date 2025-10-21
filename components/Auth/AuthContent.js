import { View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import AuthForm from './AuthForm';
import Button from '../ui/Button';
import FlatButton from '../ui/FlatButton';

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
    <View className="flex-1 justify-center px-6 bg-black">
      <Text className="text-center text-4xl font-bold text-white mb-4">
        {isLogin ? 'Welcome Back' : 'Register'}
      </Text>
      <Text className="text-center text-base text-white opacity-80 mb-6">
        {isLogin ? 'Login to your account' : 'Create your new account'}
      </Text>

      <View className="bg-[#111111] p-6 rounded-xl shadow-lg mb-6">
        <AuthForm
          isLogin={isLogin}
          onSubmit={submitHandler}
          credentialsInvalid={credentialsInvalid}
        />
      </View>

      <FlatButton className="text-center text-white opacity-80 mb-6">
        Forgot your password?
      </FlatButton>

      {!isLogin && (
        <>
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-white opacity-20" />
            <Text className="text-white opacity-50 px-3 text-sm">or continue with</Text>
            <View className="flex-1 h-px bg-white opacity-20" />
          </View>

          <View className="flex-row justify-center gap-5 mb-4">
            <TouchableOpacity className="w-14 h-14 rounded-full bg-[#222222] justify-center items-center border border-white/10">
              <Icon name="google" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity className="w-14 h-14 rounded-full bg-[#222222] justify-center items-center border border-white/10">
              <Icon name="apple" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <View className="flex-row justify-center mt-6">
        <Text className="text-white opacity-70 text-center">
          {isLogin ? "Don't have an account? " : 'Already have an account?'}
        </Text>
        <FlatButton onPress={switchAuthModeHandler}>
          {isLogin ? ' Sign up' : ' Log in'}
        </FlatButton>
      </View>

      {isLogin && (
        <Button className="mt-5" onPress={handleDemoLogin}>
          Trying Demo
        </Button>
      )}
    </View>
  );
}

export default AuthContent;
