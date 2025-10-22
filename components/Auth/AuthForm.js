import { View, Text } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Input from './Input';
import Button from '../ui/Button';
import { Colors } from '../../constants/styles';

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
    <View style={{ width: '100%' }}>
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

      <Button
        onPress={submitHandler}
        style={{
          marginTop: 20,
          backgroundColor: Colors.accent,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ color: Colors.text, fontWeight: 'bold', fontSize: 16 }}>
            {isLogin ? 'Login' : 'Sign up'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.text} />
        </View>
      </Button>
    </View>
  );
}

export default AuthForm;
