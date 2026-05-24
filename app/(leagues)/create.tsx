import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import type { components } from '@/types/api';
import { Text } from '@/components/ui';
import { useTournaments } from '@/hooks/useTournaments';
import { useCreateLeague } from '@/hooks/useLeagues';
import { ApiError } from '@/api/client';

type Tournament = components['schemas']['Tournament'];
type League = components['schemas']['League'];

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

function ChevronDownIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="rgba(245,232,210,0.55)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

// ─── Tournament picker modal ─────────────────────────────────────────────────

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TournamentPickerProps {
  tournaments: Tournament[];
  selected: Tournament | null;
  onSelect: (t: Tournament) => void;
}

function TournamentPicker({ tournaments, selected, onSelect }: TournamentPickerProps) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<TriggerLayout | null>(null);
  const triggerRef = useRef<View>(null);

  function handleOpen() {
    triggerRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setLayout({ x: pageX, y: pageY, width, height });
      setOpen(true);
    });
  }

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel="Select tournament"
        className="rounded-card border bg-surface-raised h-14 px-4 flex-row items-center justify-between"
        style={{ borderColor: selected ? '#D86B3D' : 'rgba(245,232,210,0.08)' }}
      >
        <Text className={selected ? 'text-ink text-[16px]' : 'text-ink-dim text-[16px]'}>
          {selected ? selected.name : 'Select tournament'}
        </Text>
        <ChevronDownIcon />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          {layout !== null && (
            <View
              style={{
                position: 'absolute',
                top: layout.y + layout.height + 4,
                left: layout.x,
                width: layout.width,
                maxHeight: 260,
                backgroundColor: '#231B17',
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(245,232,210,0.08)',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.45,
                shadowRadius: 18,
                elevation: 12,
              }}
            >
              <ScrollView bounces={false}>
                {tournaments.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => { onSelect(t); setOpen(false); }}
                    className="px-4 py-4 border-b border-line flex-row items-center justify-between"
                  >
                    <Text className="text-ink text-[15px] flex-1 mr-3">{t.name}</Text>
                    {selected?.id === t.id && (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#D86B3D" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Success state ───────────────────────────────────────────────────────────

function SuccessView({ league }: { league: League }) {
  async function handleShare() {
    await Share.share({
      message: `Join my league "${league.name}" on Footy Forecast! Code: ${league.code}`,
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
            LEAGUE CREATED
          </Text>
        </View>

        <Text className="mt-3 font-display font-bold text-ink leading-tight" style={{ fontSize: 34 }}>
          {league.name}
        </Text>

        <Text className="mt-3 text-[14px] leading-relaxed text-ink-muted max-w-[300px]">
          {"You're the administrator. Share the code so your friends can join."}
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

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CreateScreen() {
  const [name, setName] = useState('');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);
  const inputRef = useRef<TextInput>(null);

  const { data: tournaments = [], isLoading: tournamentsLoading } = useTournaments();
  const { mutate: createLeague, isPending, error } = useCreateLeague();

  const nameValid = name.trim().length >= 3 && name.trim().length <= 32;
  const canSubmit = nameValid && tournament !== null && !isPending;

  const errorMessage =
    error instanceof ApiError && error.status === 400
      ? 'Invalid league name. Please try a different name.'
      : error !== null
        ? 'Something went wrong. Please try again.'
        : null;

  function handleSubmit() {
    if (!canSubmit || !tournament) return;
    createLeague(
      { tournament_id: tournament.id, name: name.trim() },
      { onSuccess: (league) => setCreatedLeague(league) },
    );
  }

  if (createdLeague) {
    return <SuccessView league={createdLeague} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-5 pt-3 flex-row items-center gap-3">
          <BackChevron onPress={() => router.back()} />
          <Wordmark />
        </View>

        {/* Body */}
        <ScrollView className="flex-1" contentContainerClassName="px-6 pt-9 pb-6" keyboardShouldPersistTaps="handled">
          <Text className="font-mono text-eyebrow uppercase text-brand-500 tracking-widest">
            NEW LEAGUE
          </Text>
          <Text className="mt-3 font-display font-bold text-ink leading-tight" style={{ fontSize: 36 }}>
            {"Give it a\nname."}
          </Text>
          <Text className="mt-3 text-[14px] leading-relaxed text-ink-muted max-w-[300px]">
            Something your friends will recognize. You can rename it later.
          </Text>

          {/* Tournament picker */}
          <View className="mt-6">
            <Text className="font-mono text-eyebrow uppercase text-ink-muted mb-1.5">TOURNAMENT</Text>
            {tournamentsLoading ? (
              <View className="rounded-card border border-line bg-surface-raised h-14 px-4 justify-center">
                <Text className="text-ink-dim text-[16px]">Loading…</Text>
              </View>
            ) : tournaments.length === 0 ? (
              <View className="rounded-card border border-line bg-surface-raised h-14 px-4 justify-center">
                <Text className="text-ink-dim text-[16px]">No active tournaments</Text>
              </View>
            ) : (
              <TournamentPicker
                tournaments={tournaments}
                selected={tournament}
                onSelect={setTournament}
              />
            )}
          </View>

          {/* League name field */}
          <View className="mt-7">
            <Text className="font-mono text-eyebrow uppercase text-ink-muted mb-1.5">LEAGUE NAME</Text>
            <View
              className="rounded-card bg-surface-raised h-14 px-4 flex-row items-center"
              style={{ borderWidth: 1, borderColor: name.length > 0 ? '#D86B3D' : 'rgba(245,232,210,0.08)' }}
            >
              <TextInput
                ref={inputRef}
                value={name}
                onChangeText={(v) => setName(v.slice(0, 32))}
                onSubmitEditing={handleSubmit}
                placeholder="Campeones"
                placeholderTextColor="rgba(245,232,210,0.35)"
                returnKeyType="done"
                className="flex-1 text-ink text-[16px]"
                style={{ fontFamily: undefined }}
                autoFocus
              />
              <Text className="font-mono text-[11px] text-ink-dim">
                {name.length}/32
              </Text>
            </View>
            <Text className="mt-2 text-[12px] text-ink-dim">3–32 characters. Emoji allowed.</Text>
          </View>

          {/* Error */}
          {errorMessage !== null && (
            <View className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3">
              <Text className="text-[12.5px] text-danger text-center">{errorMessage}</Text>
            </View>
          )}
        </ScrollView>

        {/* CTA */}
        <View className="px-5 pb-10">
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            className={`w-full h-14 rounded-pill bg-brand-500 items-center justify-center flex-row gap-2.5 ${!canSubmit ? 'opacity-40' : ''}`}
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 6 }}
          >
            <Text className="font-semibold text-[15px] text-ink-invert">
              {isPending ? 'Creating…' : 'Create league'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
