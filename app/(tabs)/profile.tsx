import { useState, useEffect } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Button } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSession } from '@/auth/session';

function WarmTopGlow() {
  return (
    <LinearGradient
      colors={['rgba(216,107,61,0.18)', 'rgba(216,107,61,0)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      pointerEvents="none"
    />
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarClearance = Math.max(insets.bottom, 12) + 64 + 12;

  const { data: currentUser, isPending } = useCurrentUser();
  const { signOut } = useSession();

  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (currentUser) setDisplayName(currentUser.display_name);
  }, [currentUser]);

  const isDirty = displayName.trim() !== (currentUser?.display_name ?? '');
  const isValid = displayName.trim().length >= 1;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-3">
          {/* Eyebrow */}
          <View className="pt-9 pb-8">
            <Text variant="eyebrow">PROFILE</Text>
          </View>

          {/* Display name field */}
          <Text className="font-mono uppercase text-ink-dim text-[10px] tracking-[0.18em] mb-2">
            Display name
          </Text>
          <View
            className="rounded-card bg-surface-raised h-14 px-4 flex-row items-center"
            style={{
              borderWidth: 1,
              borderColor: displayName.length > 0 ? '#D86B3D' : 'rgba(245,232,210,0.08)',
            }}
          >
            <TextInput
              value={displayName}
              onChangeText={(v) => setDisplayName(v.slice(0, 64))}
              placeholder="Your name"
              placeholderTextColor="rgba(245,232,210,0.35)"
              returnKeyType="done"
              className="flex-1 text-ink text-[16px]"
              style={{ fontFamily: undefined }}
              editable={!isPending}
            />
            <Text className="font-mono text-[11px] text-ink-dim">
              {displayName.length}/64
            </Text>
          </View>

          {/* Email (read-only) */}
          {currentUser && (
            <Text className="mt-3 text-[12px] text-ink-dim">
              {currentUser.email}
            </Text>
          )}

          {/* Save — dummy until PATCH /users/me is available */}
          <View className="mt-6">
            <Button
              label="Save"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isDirty || !isValid}
              onPress={() => {
                // TODO: call PATCH /users/me when endpoint is available
              }}
            />
          </View>
        </View>

        {/* Sign out — pinned to bottom */}
        <View className="px-5" style={{ paddingBottom: tabBarClearance }}>
          <Button
            label="Sign out"
            variant="ghost"
            size="lg"
            fullWidth
            onPress={() => void signOut()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
