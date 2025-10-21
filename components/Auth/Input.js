import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/styles';

function Input({
  label,
  keyboardType,
  secure,
  onUpdateValue,
  value,
  isInvalid,
  showToggleIcon,
  onToggleSecure,
  secureVisible,
}) {
  let iconName;

  if (label.toLowerCase().includes('email')) {
    iconName = 'mail-outline';
  } else if (label.toLowerCase().includes('password')) {
    iconName = 'lock-closed-outline';
  } else if (label.toLowerCase().includes('name')) {
    iconName = 'person-outline';
  }

  return (
    <View className="my-2">
      <Text className={`mb-1 text-sm ${isInvalid ? 'text-red-500' : 'text-white'}`}>
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-lg px-2 py-3 ${isInvalid ? 'bg-red-100' : 'bg-gray-200'
          }`}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={Colors.primary500}
            className="mr-1"
          />
        )}
        <TextInput
          className="flex-1 text-balck text-base ml-2"
          autoCapitalize="none"
          keyboardType={keyboardType}
          secureTextEntry={secure}
          onChangeText={onUpdateValue}
          value={value}
          placeholder={label}
          placeholderTextColor="#AFAFAF"
        />
        {showToggleIcon && (
          <TouchableOpacity onPress={onToggleSecure}>
            <Ionicons
              name={secureVisible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color="#AFAFAF"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default Input;
