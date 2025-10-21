import { Pressable, Text, View } from 'react-native';
import { Colors } from '../../constants/styles';


function Button({ children, onPress }) {
  return (
    <Pressable
      className="rounded-md bg-primary100 shadow-md py-2 px-3"
      style={({ pressed }) => pressed && { opacity: 0.7 }}
      onPress={onPress}
    >
      <View>
        <Text className="text-center text-white text-base font-bold">
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export default Button;
