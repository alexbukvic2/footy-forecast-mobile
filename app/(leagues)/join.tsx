import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import type { components } from '@/types/api';
import { Text } from '@/components/ui';
import { useJoinLeague } from '@/hooks/useLeagues';
import { ApiError } from '@/api/client';

type League = components['schemas']['League'];

const SLOTS = 8;

// ─── Brand atoms ────────────────────────────────────────────────────────────

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

function Wordmark() {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-7 h-7 rounded-card bg-brand-500 items-center justify-center">
        <Text className="font-display font-bold text-ink-invert text-[11px]">FF</Text>
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

function BackChevron({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Back"
      className="w-9 h-9 rounded-pill border border-line items-center justify-center"
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#F5E8D2" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 18L9 12L15 6" />
      </Svg>
    </Pressable>
  );
}

// ─── Success state ───────────────────────────────────────────────────────────

function SuccessView({ league }: { league: League }) {
  const created = new Date(league.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  async function handleShare() {
    await Share.share({
      message: `I just joined "${league.name}" on Footy Forecast! Code: ${league.code}`,
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      <View className="px-5 pt-3">
        <Wordmark />
      </View>

      <View className="flex-1 px-6 pt-9">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-1.5 rounded-full bg-success" />
          <Text className="font-mono text-eyebrow uppercase tracking-widest text-success">
            {"YOU'RE IN"}
          </Text>
        </View>

        <Text className="mt-3 font-display font-bold text-ink leading-tight" style={{ fontSize: 34 }}>
          {league.name}
        </Text>

        <Text className="mt-3 text-[14px] leading-relaxed text-ink-muted max-w-[300px]">
          {"You've joined the pool. Your first predictions are due before kickoff."}
        </Text>

        {/* Code card */}
        <View className="mt-7 rounded-card border border-line bg-surface-raised p-5">
          <Text className="font-mono text-eyebrow uppercase text-ink-muted">JOIN CODE</Text>
          <View className="mt-1 flex-row items-center justify-between gap-3">
            <Text className="font-mono font-bold text-ink tracking-widest" style={{ fontSize: 30 }}>
              {league.code.slice(0, 4)}
              <Text className="text-ink-dim"> </Text>
              {league.code.slice(4)}
            </Text>
            <Pressable
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share code"
              className="h-9 px-3 rounded-pill border border-line flex-row items-center gap-1.5"
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(245,232,210,0.55)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <Path d="M16 6l-4-4-4 4" />
                <Path d="M12 2v13" />
              </Svg>
              <Text className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Share</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View className="mt-5 rounded-card border border-line overflow-hidden">
          <View className="bg-bg p-4">
            <Text className="font-mono text-eyebrow uppercase text-ink-muted">CREATED</Text>
            <Text className="mt-1 font-display font-bold text-[22px] text-ink leading-[30px]">{created}</Text>
          </View>
        </View>
      </View>

      <View className="px-5 pb-10">
        <Pressable
          onPress={() => router.replace('/(tabs)/leagues')}
          accessibilityRole="button"
          className="w-full h-14 rounded-pill bg-brand-500 items-center justify-center"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 6 }}
        >
          <Text className="font-semibold text-[15px] text-ink-invert">{"Go to my leagues"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Code tile ───────────────────────────────────────────────────────────────

interface CodeTileProps {
  value: string;
  isFocused: boolean;
  hasError: boolean;
  inputRef: (el: TextInput | null) => void;
  onChangeText: (val: string) => void;
  onKeyPress: (e: { nativeEvent: { key: string } }) => void;
  onFocus: () => void;
}

function CodeTile({ value, isFocused, hasError, inputRef, onChangeText, onKeyPress, onFocus }: CodeTileProps) {
  const borderColor = hasError
    ? '#D84A4A'
    : isFocused
      ? '#D86B3D'
      : value
        ? 'rgba(245,232,210,0.16)'
        : 'rgba(245,232,210,0.08)';

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      onKeyPress={onKeyPress}
      onFocus={onFocus}
      autoCapitalize="characters"
      autoCorrect={false}
      selectTextOnFocus
      keyboardType="default"
      className="w-12 h-14 rounded-card bg-surface-raised font-mono font-bold text-ink text-center text-[24px]"
      style={{ borderWidth: 2, borderColor }}
      maxLength={SLOTS}
    />
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function JoinScreen() {
  const [digits, setDigits] = useState<string[]>(Array(SLOTS).fill(''));
  const [focusIdx, setFocusIdx] = useState(0);
  const [joinedLeague, setJoinedLeague] = useState<League | null>(null);
  const inputsRef = useRef<(TextInput | null)[]>(Array(SLOTS).fill(null));

  const { mutate: joinLeague, isPending, error, reset } = useJoinLeague();

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const code = digits.join('');
  const filled = code.length === SLOTS;

  const errorMessage =
    error instanceof ApiError && error.status === 404
      ? `No league with code ${code}. Check with the commissioner.`
      : error instanceof ApiError && error.status === 409
        ? 'You are already a member of this league.'
        : error !== null
          ? 'Something went wrong. Please try again.'
          : null;

  function handleChangeText(i: number, val: string) {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[i] = '';
      setDigits(next);
      reset();
      return;
    }
    const next = [...digits];
    let cursor = i;
    for (const ch of cleaned) {
      if (cursor >= SLOTS) break;
      next[cursor] = ch;
      cursor++;
    }
    setDigits(next);
    reset();
    const nextFocus = Math.min(cursor, SLOTS - 1);
    setFocusIdx(nextFocus);
    inputsRef.current[nextFocus]?.focus();
  }

  function handleKeyPress(i: number, e: { nativeEvent: { key: string } }) {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      reset();
      inputsRef.current[i - 1]?.focus();
      setFocusIdx(i - 1);
    }
  }

  function handleSubmit() {
    if (!filled || isPending) return;
    joinLeague(code, {
      onSuccess: (league) => setJoinedLeague(league),
    });
  }

  if (joinedLeague) {
    return <SuccessView league={joinedLeague} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Header */}
      <View className="px-5 pt-3 flex-row items-center gap-3">
        <BackChevron onPress={() => router.back()} />
        <Wordmark />
      </View>

      {/* Body */}
      <View className="flex-1 px-6 pt-9">
        <Text className="font-mono text-eyebrow uppercase text-brand-500 tracking-widest">
          ENTER CODE
        </Text>
        <Text className="mt-3 font-display font-bold text-ink leading-tight" style={{ fontSize: 36 }}>
          {"What's the\ncode?"}
        </Text>
        <Text className="mt-3 text-[14px] leading-relaxed text-ink-muted max-w-[300px]">
          Six characters from whoever runs the league. Not case sensitive.
        </Text>

        {/* 6-tile input */}
        <View className="mt-9 flex-row items-center justify-center gap-2">
          {digits.map((d, i) => (
            <View key={i} className="relative">
              <CodeTile
                value={d}
                isFocused={i === focusIdx}
                hasError={errorMessage !== null}
                inputRef={(el) => { inputsRef.current[i] = el; }}
                onChangeText={(val) => handleChangeText(i, val)}
                onKeyPress={(e) => handleKeyPress(i, e)}
                onFocus={() => setFocusIdx(i)}
              />
              {i === 3 && (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', right: -10, top: '50%', transform: [{ translateY: -8 }] }}
                >
                  <Text className="text-ink-dim font-mono text-[18px]">·</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Error */}
        <View className="mt-4 min-h-[20px] items-center">
          {errorMessage !== null && (
            <Text className="text-[12.5px] text-danger text-center">{errorMessage}</Text>
          )}
        </View>
      </View>

      {/* CTA */}
      <View className="px-5 pb-10">
        <Pressable
          onPress={handleSubmit}
          disabled={!filled || isPending}
          accessibilityRole="button"
          className={`w-full h-14 rounded-pill bg-brand-500 items-center justify-center ${!filled || isPending ? 'opacity-40' : ''}`}
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 6 }}
        >
          <Text className="font-semibold text-[15px] text-ink-invert">
            {isPending ? 'Checking…' : 'Join league'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
