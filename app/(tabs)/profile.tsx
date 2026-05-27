import { useSession } from '@/auth/session';
import { Button, Text } from '@/components/ui';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Brand atoms ──────────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarClearance = Math.max(insets.bottom, 12) + 64 + 12;

  // Profile state
  const { data: currentUser, isPending: userPending } = useCurrentUser();
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
        <ScrollView
          className="flex-1 px-5 pt-3"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: tabBarClearance }}
        >
          {/* Profile section */}
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
              editable={!userPending}
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

          {/* Sign out */}
          <View className="mt-6">
            <Button
              label="Sign out"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={() => void signOut()}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}
