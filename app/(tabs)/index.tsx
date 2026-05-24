import { View } from 'react-native';
import { Text } from '@/components/ui';
import { useSession } from '@/auth/session';

export default function HomeScreen() {
  const { signOut } = useSession();

  return (
    <View className="flex-1 bg-bg items-center justify-center gap-6">
      <Text variant="title">You&apos;re signed in.</Text>
      <Text
        variant="body"
        tone="muted"
        className="underline"
        onPress={() => void signOut()}
      >
        Sign out
      </Text>
    </View>
  );
}
