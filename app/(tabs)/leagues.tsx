import { Text } from '@/components/ui';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LeagueScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <Text variant="eyebrow">LEAGUE</Text>
      </View>
    </SafeAreaView>
  );
}
