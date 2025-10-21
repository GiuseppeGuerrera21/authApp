import { View, Text } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

import Input from './Input';
import Button from '../ui/Button';

function AuthForm({ isLogin, onSubmit, credentialsInvalid }) {
  const [enteredName, setEnteredName] = useState('');
  const [enteredEmail, setEnteredEmail] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  function updateInputValueHandler(inputType, enteredValue) {
    switch (inputType) {
      case 'name':
        setEnteredName(enteredValue);
        break;
      case 'email':
        setEnteredEmail(enteredValue);
        break;
      case 'password':
        setEnteredPassword(enteredValue);
        break;
    }
  }

  function submitHandler() {
    if (isLogin) {
      onSubmit({
        email: enteredEmail,
        password: enteredPassword,
      });
    } else {
      onSubmit({
        name: enteredName,
        email: enteredEmail,
        password: enteredPassword,
      });
    }
  }

  return (
    <View className="w-full">
      {!isLogin && (
        <Input
          label="Name"
          onUpdateValue={(val) => updateInputValueHandler('name', val)}
          value={enteredName}
          isInvalid={credentialsInvalid.name}
        />
      )}
      <Input
        label="Email"
        keyboardType="email-address"
        onUpdateValue={(val) => updateInputValueHandler('email', val)}
        value={enteredEmail}
        isInvalid={credentialsInvalid.email}
      />
      <Input
        label="Password"
        secure={!passwordVisible}
        onUpdateValue={(val) => updateInputValueHandler('password', val)}
        value={enteredPassword}
        isInvalid={credentialsInvalid.password}
        showToggleIcon
        onToggleSecure={() => setPasswordVisible((prev) => !prev)}
        secureVisible={passwordVisible}
      />

      <Button onPress={submitHandler} className="mt-5">
        <View className="flex-row items-center justify-center space-x-2">
          <Text className="text-white font-bold text-base">
            {isLogin ? 'Login' : 'Sign up'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </View>
      </Button>
    </View>
  );
}

export default AuthForm;
