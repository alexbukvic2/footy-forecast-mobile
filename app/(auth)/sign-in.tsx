import { useEffect, useState } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from '@tanstack/react-query';

import { Text } from '../../components/ui';
import { useSession } from '../../auth/session';
import {
  getCognitoClientId,
  getDiscovery,
  COGNITO_REDIRECT_URI,
} from '../../auth/config';
import type { StoredSession } from '../../auth/storage';

// Required by expo-auth-session on iOS to close the browser after the redirect.
WebBrowser.maybeCompleteAuthSession();

// ─────────────────────────────────────────────────────────────────────────────
// Brand atoms — sign-in only. Promote to components/brand/* if reused.
// ─────────────────────────────────────────────────────────────────────────────

function Wordmark() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-8 h-8 rounded-card bg-brand-500 items-center justify-center">
        <Text className="font-display font-bold text-ink-invert text-[13px]">FF</Text>
      </View>
      <View>
        <Text className="font-display font-bold text-sm tracking-tight">Footy Forecast</Text>
        <Text className="font-mono uppercase text-ink-dim tracking-widest text-[9px]">
          {"World Cup '26 · beta"}
        </Text>
      </View>
    </View>
  );
}

/** Official Google "G" mark — required by Google's SSO brand guidelines. */
function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </Svg>
  );
}

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
}

function GoogleSignInButton({ onPress, loading }: GoogleSignInButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      onPress={onPress}
      disabled={loading}
      className="w-full h-14 rounded-pill bg-white active:bg-white/90 flex-row items-center justify-center gap-3"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
        elevation: 6,
      }}
    >
      <GoogleG size={20} />
      <Text className="font-semibold text-[15px]" style={{ color: '#1A1A1A' }}>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </Text>
    </Pressable>
  );
}

function Legal() {
  return (
    <View className="items-center px-6">
      <Text variant="caption" tone="dim" align="center" className="leading-relaxed">
        By continuing you agree to our{' '}
        <Text
          variant="caption"
          tone="muted"
          className="underline"
          onPress={() => void Linking.openURL('https://example.com/terms')}
        >
          Terms
        </Text>
        {' '}and{' '}
        <Text
          variant="caption"
          tone="muted"
          className="underline"
          onPress={() => void Linking.openURL('https://example.com/privacy')}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

function ConcentricBadge() {
  return (
    <View className="relative items-center justify-center" style={{ width: 168, height: 168 }}>
      <View className="absolute inset-0 rounded-pill border border-line" />
      <View
        className="absolute rounded-pill border border-line-strong"
        style={{ top: 16, left: 16, right: 16, bottom: 16 }}
      />
      <View
        className="rounded-pill bg-brand-500 items-center justify-center shadow-card"
        style={{ width: 88, height: 88 }}
      >
        <Text className="font-display font-bold text-ink-invert text-hud-lg tracking-tight">FF</Text>
      </View>
      {Array.from({ length: 12 }).map((_, i) => (
        <View
          key={i}
          className="absolute"
          style={{
            width: 2,
            height: 7,
            backgroundColor: 'rgba(245,232,210,0.18)',
            transform: [{ rotate: `${i * 30}deg` }, { translateY: -76 }],
          }}
        />
      ))}
    </View>
  );
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [error, setError] = useState<string | null>(null);

  const discovery = getDiscovery();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getCognitoClientId(),
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'email', 'profile'],
      redirectUri: COGNITO_REDIRECT_URI,
      // Go straight to Google, skip the Cognito login page.
      extraParams: { identity_provider: 'Google' },
      usePKCE: true,
    },
    discovery,
  );

  const exchangeMutation = useMutation({
    mutationFn: async ({
      code,
      codeVerifier,
    }: {
      code: string;
      codeVerifier: string;
    }): Promise<StoredSession> => {
      const tokens = await AuthSession.exchangeCodeAsync(
        {
          clientId: getCognitoClientId(),
          code,
          redirectUri: COGNITO_REDIRECT_URI,
          extraParams: { code_verifier: codeVerifier },
        },
        discovery,
      );
      return {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken ?? '',
        refreshToken: tokens.refreshToken ?? '',
        expiresAt: Date.now() + (tokens.expiresIn ?? 3600) * 1000,
      };
    },
    onSuccess: async (tokens) => {
      await signIn(tokens);
      router.replace('/(tabs)');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    },
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const code = response.params['code'];
      const codeVerifier = request?.codeVerifier;
      if (!code || !codeVerifier) {
        setError('Authentication failed: missing auth code.');
        return;
      }
      exchangeMutation.mutate({ code, codeVerifier });
    } else if (response.type === 'error') {
      setError(response.error?.message ?? 'Authentication failed.');
    }
    // type === 'cancel' or 'dismiss': do nothing, let the user retry
  }, [response]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = !request || exchangeMutation.isPending;

  async function handleContinueWithGoogle() {
    setError(null);
    try {
      await promptAsync();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Wordmark */}
      <View className="px-5 pt-3 items-center">
        <Wordmark />
      </View>

      {/* Centerpiece visual + tagline */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-10">
          <ConcentricBadge />
        </View>

        <Text variant="title" align="center">
          Predict every match.
        </Text>
        <Text variant="title" tone="brand" align="center">
          Beat your friends.
        </Text>
        <Text variant="body" tone="muted" align="center" className="mt-4 max-w-[260px]">
          48 teams. 104 matches. One leaderboard between you and bragging rights.
        </Text>
      </View>

      {/* Error banner */}
      {error !== null && (
        <View className="mx-5 mb-3 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
          <Text variant="caption" align="center" className="text-danger">
            {error}
          </Text>
        </View>
      )}

      {/* Google SSO + legal */}
      <View className="px-5 pb-6 gap-5">
        <GoogleSignInButton onPress={handleContinueWithGoogle} loading={loading} />
        <Legal />
      </View>
    </SafeAreaView>
  );
}
