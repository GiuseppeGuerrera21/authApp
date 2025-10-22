import { Pressable, Text, View } from 'react-native';
import { Colors } from '../../constants/styles';

function Button({ children, onPress, className }) {
  const baseClasses = "bg-accent rounded-xl py-3 px-5 shadow-md active:opacity-80";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <Pressable
      onPress={onPress}
      className={combinedClasses}
    >
      <View>
        <Text className="text-text text-center font-bold text-base">
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export default Button;
