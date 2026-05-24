/**
 * app/(onboarding)/leagues/* — League entry flow
 *
 * DESIGN REFERENCE, not drop-in code. Hand it to Claude Code as the visual
 * target while wiring up real league create/join, error handling, navigation,
 * and analytics. The flow is:
 *
 *     /leagues          → LeaguesChooserScreen     ("no league" gate)
 *       ├─ /leagues/create → LeaguesCreateScreen   (name a new league)
 *       └─ /leagues/join   → LeaguesJoinScreen     (enter 6-char code)
 *                              ↓ (on success — both flows)
 *                            LeaguesSuccessScreen   (shared confirmation)
 *
 * All four screen components are exported below. Map them to your router
 * however you prefer; the screens themselves don't import router APIs —
 * they take `onCreate` / `onJoin` / `onBack` / `onContinue` callbacks so
 * they're trivial to test and to drop into Storybook.
 *
 * Import depth assumes routes live under `app/(onboarding)/leagues/`. Adjust
 * `../../../components/ui` if you flatten the route layout.
 */

import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
    Check,
    CheckSquare,
    ChevronLeft,
    Copy,
    Plus,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    Pressable,
    TextInput,
    View,
    type TextInput as TextInputType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, Text } from '../../../components/ui';

// ────────────────────────────────────────────────────────────────────
// Shared atoms — promote to components/brand/* once we have a second
// screen that needs them (Wordmark + WarmTopGlow already exist on the
// sign-in screen; consolidate at that point).
// ────────────────────────────────────────────────────────────────────

function Wordmark({ size = 'sm' as 'sm' | 'md' }) {
  const dims = size === 'md'
    ? { box: 32, mark: 13, wm: 'text-sm' as const }
    : { box: 26, mark: 11, wm: 'text-[11px]' as const };
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className="rounded-card bg-brand-500 items-center justify-center"
        style={{ width: dims.box, height: dims.box }}
      >
        <Text className="font-display font-bold text-ink-invert" style={{ fontSize: dims.mark }}>
          FF
        </Text>
      </View>
      <View>
        <Text className={`font-display font-bold tracking-tight ${dims.wm}`}>
          Footy Forecast
        </Text>
        <Text className="font-mono uppercase text-ink-dim tracking-widest text-[9px]">
          World Cup '26 · beta
        </Text>
      </View>
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

function BackChevron({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      className="w-9 h-9 rounded-pill border border-line items-center justify-center active:bg-surface-raised"
    >
      <ChevronLeft size={18} color="#F5E8D2" />
    </Pressable>
  );
}

/**
 * Sub-screen top bar: back chevron + small wordmark. Sticks to the safe-area
 * top. Used by Create, Join, and Success (with the chevron swapped for an
 * optional "start over" affordance).
 */
function SubScreenTopBar({
  onBack,
  trailing,
}: {
  onBack?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View className="px-5 pt-3 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        {onBack ? <BackChevron onPress={onBack} /> : null}
        <Wordmark size="sm" />
      </View>
      {trailing}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────
// Join-code helpers
// ────────────────────────────────────────────────────────────────────

/**
 * Alphabet excludes the ambiguous glyphs `0 1 I O` so codes are robust to
 * being read aloud, hand-copied, or OCR'd from a screenshot. 6 chars over
 * 32 symbols = ~30 bits — plenty of room for the foreseeable userbase.
 *
 * Real implementation must generate codes server-side and persist them
 * uniquely per league; this helper exists for the preview chip on Create.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export function genJoinCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────
// 01 · Chooser — no-league gate
// ────────────────────────────────────────────────────────────────────

export interface LeaguesChooserProps {
  onCreate: () => void;
  onJoin: () => void;
}

/**
 * Sits between sign-in success and the tabs layout. Showed only when the
 * user has zero league memberships. Once joined to ≥1 league, this route
 * redirects to `/(tabs)/today` and is never seen again.
 *
 * Typography-led; no decorative badge. The two small explainer cards above
 * the CTAs preview each option (terracotta `+` icon for create, check-on-
 * clipboard for join) so the user understands the difference before they
 * tap.
 */
export function LeaguesChooserScreen({ onCreate, onJoin }: LeaguesChooserProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Top bar */}
      <View className="px-5 pt-3 flex-row items-center">
        <Wordmark size="sm" />
      </View>

      {/* Hero + explainer */}
      <View className="flex-1 px-6 pt-12">
        <Text variant="eyebrow">ROSTER · EMPTY</Text>

        <Text
          variant="display"
          className="mt-3 leading-[0.96] tracking-tight"
          style={{ fontSize: 42 }}
        >
          You're in.{'\n'}
          <Text variant="display" tone="brand" style={{ fontSize: 42 }}>
            Now pick a side.
          </Text>
        </Text>

        <Text variant="body" tone="muted" className="mt-5 max-w-[300px] leading-relaxed">
          Spin up your own pool, or drop into one a friend already started.
        </Text>

        {/* Two explainer cards. We use raw Views (not <Card>) because these
            are visual previews, not interactive — the CTAs do the work. */}
        <View className="mt-8 flex-row gap-3">
          {(
            [
              { Icon: Plus,         title: 'Start one',   sub: "You'll get a code to share." },
              { Icon: CheckSquare,  title: 'Got a code?', sub: 'Six letters from a friend.'   },
            ] as const
          ).map(({ Icon, title, sub }) => (
            <View
              key={title}
              className="flex-1 rounded-card border border-line bg-surface/40 p-4"
            >
              <View className="w-10 h-10 rounded-card bg-brand-soft items-center justify-center mb-3">
                <Icon size={20} color="#D86B3D" />
              </View>
              <Text variant="heading" className="text-[15px] leading-tight">{title}</Text>
              <Text variant="caption" tone="dim" className="mt-1 text-[12px] leading-snug">
                {sub}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTAs */}
      <View className="px-5 pb-6 gap-3">
        <Button label="Create a league" variant="primary" size="lg" fullWidth onPress={onCreate} />
        <Button label="Join with code"  variant="secondary" size="lg" fullWidth onPress={onJoin}   />
      </View>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────
// 02 · Create league
// ────────────────────────────────────────────────────────────────────

export interface CreatedLeague {
  name: string;
  code: string;
  members: number;
  created: string; // e.g. "just now"
}

export interface LeaguesCreateProps {
  onBack: () => void;
  /** Resolves on the screen calling this with the new league record. */
  onCreate: (league: CreatedLeague) => Promise<void> | void;
}

/**
 * Single text input + one CTA. The join code is rolled client-side and shown
 * as a read-only preview chip so the user sees the artifact they'll be
 * sharing before they commit — small but high-trust detail.
 *
 * The real implementation should generate the code server-side (the preview
 * here is for UX continuity only) and validate name uniqueness within the
 * user's circle if you want to prevent duplicates.
 */
export function LeaguesCreateScreen({ onBack, onCreate }: LeaguesCreateProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInputType>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const trimmed = name.trim();
  const valid = trimmed.length >= 3 && trimmed.length <= 32;

  async function submit() {
    if (!valid || loading) return;
    setLoading(true);
    try {
      await onCreate({ name: trimmed, code: genJoinCode(), members: 1, created: 'just now' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      <SubScreenTopBar onBack={onBack} />

      <View className="flex-1 px-6 pt-9">
        <Text variant="eyebrow">NEW LEAGUE · 01 / 01</Text>
        <Text
          variant="display"
          className="mt-3 leading-[1.0] tracking-tight"
          style={{ fontSize: 36 }}
        >
          Give it a{'\n'}name.
        </Text>
        <Text variant="body" tone="muted" className="mt-3 max-w-[300px] leading-relaxed">
          Something your friends will recognize. You can rename it later.
        </Text>

        {/* League name */}
        <View className="mt-7">
          <Input
            ref={inputRef}
            label="LEAGUE NAME"
            value={name}
            onChangeText={(t) => setName(t.slice(0, 32))}
            placeholder="Campeones"
            returnKeyType="done"
            onSubmitEditing={submit}
            size="lg"
            maxLength={32}
            rightAddon={
              <Text variant="mono" tone="dim" className="text-[11px]" tabular>
                {name.length}/32
              </Text>
            }
            hint="3–32 characters. Emoji allowed."
          />
        </View>
      </View>

      <View className="px-5 pb-6">
        <Button
          label={loading ? 'Creating…' : 'Create league'}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!valid}
          onPress={submit}
        />
      </View>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────
// 03 · Join league
// ────────────────────────────────────────────────────────────────────

export interface JoinedLeague {
  name: string;
  code: string;
  members: number;
  created: string;
}

export interface LeaguesJoinProps {
  onBack: () => void;
  /**
   * Resolves with the joined-league record on hit, or rejects with an Error
   * whose `message` is shown inline. The screen owns its own loading state.
   */
  onJoin: (code: string) => Promise<JoinedLeague>;
}

/**
 * Six segmented monospace tiles. The interactions you want:
 *
 *   • auto-advance to next tile on character entry
 *   • backspace clears the current tile, or jumps back if already empty
 *   • paste fills as many tiles as fit, starting at the focused index
 *   • arrow keys / left-right gestures move the cursor
 *   • case-insensitive: input is uppercased and stripped to A–Z 0–9
 *
 * The Input primitive's `size="score"` tile is too tall (designed for HUD
 * score entry); we render six raw TextInputs inside one wrapper to keep the
 * mono-tile rhythm without forking the Input variant.
 */
export function LeaguesJoinScreen({ onBack, onJoin }: LeaguesJoinProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [focusIdx, setFocusIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<TextInputType | null>>([]);

  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 250);
    return () => clearTimeout(t);
  }, []);

  const code = digits.join('');
  const filled = code.length === CODE_LENGTH;

  function setSlot(i: number, raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setError(null);
    if (!cleaned) {
      const next = [...digits];
      next[i] = '';
      setDigits(next);
      return;
    }
    const next = [...digits];
    let cursor = i;
    for (const ch of cleaned) {
      if (cursor >= CODE_LENGTH) break;
      next[cursor++] = ch;
    }
    setDigits(next);
    const nf = Math.min(cursor, CODE_LENGTH - 1);
    setFocusIdx(nf);
    inputsRef.current[nf]?.focus();
  }

  function handleKey(i: number, key: string) {
    if (key === 'Backspace' && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      setFocusIdx(i - 1);
      inputsRef.current[i - 1]?.focus();
    }
  }

  async function submit() {
    if (!filled || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onJoin(code);
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : `No league with code ${code}. Check with the commissioner.`,
      );
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      <SubScreenTopBar onBack={onBack} />

      <View className="flex-1 px-6 pt-9">
        <Text variant="eyebrow">ENTER CODE</Text>
        <Text
          variant="display"
          className="mt-3 leading-[1.0] tracking-tight"
          style={{ fontSize: 36 }}
        >
          What's the{'\n'}code?
        </Text>
        <Text variant="body" tone="muted" className="mt-3 max-w-[300px] leading-relaxed">
          Six characters from whoever runs the league. Not case sensitive.
        </Text>

        {/* Segmented input */}
        <View className="mt-9 flex-row items-center justify-center gap-2">
          {digits.map((d, i) => {
            const isFocus = i === focusIdx;
            const filledTile = !!d;
            const borderColor = error
              ? '#D84A4A'
              : isFocus
                ? '#D86B3D'
                : filledTile
                  ? 'rgba(245,232,210,0.16)'
                  : 'rgba(245,232,210,0.08)';
            return (
              <View key={i} className="relative">
                <TextInput
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  value={d}
                  onChangeText={(t) => setSlot(i, t)}
                  onKeyPress={(e) => handleKey(i, e.nativeEvent.key)}
                  onFocus={() => setFocusIdx(i)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  selectionColor="#D86B3D"
                  placeholderTextColor="rgba(245,232,210,0.35)"
                  maxLength={CODE_LENGTH /* allow paste */}
                  className="w-12 h-14 rounded-card bg-surface-raised text-center font-mono font-bold text-[24px] text-ink"
                  style={{ borderWidth: 2, borderColor }}
                />
                {i === 2 ? (
                  <Text
                    tone="dim"
                    className="absolute font-mono"
                    style={{ right: -10, top: '50%', transform: [{ translateY: -10 }] }}
                  >
                    ·
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Error / hint */}
        <View className="mt-4 items-center" style={{ minHeight: 20 }}>
          {error ? (
            <Text variant="caption" tone="danger" align="center" className="text-[12.5px]">
              {error}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="px-5 pb-6">
        <Button
          label={loading ? 'Checking…' : 'Join league'}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={!filled}
          onPress={submit}
        />
      </View>
    </SafeAreaView>
  );
}

// ────────────────────────────────────────────────────────────────────
// 04 · Success — shared end state for both flows
// ────────────────────────────────────────────────────────────────────

export interface LeaguesSuccessProps {
  league: CreatedLeague | JoinedLeague;
  isCreator: boolean;
  onContinue: () => void;
  /** Optional escape hatch from the design (top-right "start over"). */
  onReset?: () => void;
}

export function LeaguesSuccessScreen({
  league,
  isCreator,
  onContinue,
  onReset,
}: LeaguesSuccessProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await Clipboard.setStringAsync(league.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      <SubScreenTopBar
        trailing={
          onReset ? (
            <Pressable onPress={onReset} hitSlop={8}>
              <Text className="font-mono uppercase tracking-widest text-ink-dim text-[9px]">
                start over
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <View className="flex-1 px-6 pt-9">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-1.5 rounded-full bg-success" />
          <Text variant="eyebrow" tone="success" className="tracking-widest">
            {isCreator ? 'LEAGUE CREATED' : "YOU'RE IN"}
          </Text>
        </View>

        <Text
          variant="display"
          className="mt-3 leading-[1.0] tracking-tight"
          style={{ fontSize: 34 }}
        >
          {league.name}
        </Text>

        <Text variant="body" tone="muted" className="mt-3 max-w-[300px] leading-relaxed">
          {isCreator
            ? "You're the commissioner. Share the code so your friends can join."
            : "You've joined the pool. Your first predictions are due before kickoff."}
        </Text>

        {/* Code card */}
        <Card tone="raised" className="mt-7">
          <Card.Body className="px-5 py-4">
            <Card.Eyebrow>JOIN CODE</Card.Eyebrow>
            <View className="mt-1 flex-row items-end justify-between gap-3">
              <View className="flex-row">
                <Text className="font-mono font-bold text-[30px] tracking-[0.22em]">
                  {league.code.slice(0, 3)}
                </Text>
                <Text className="font-mono font-bold text-[30px] tracking-[0.22em] ml-3">
                  {league.code.slice(3)}
                </Text>
              </View>
              <Button
                label={copied ? 'copied' : 'copy'}
                size="sm"
                variant="secondary"
                leftIcon={copied
                  ? <Check size={14} color="#7FB069" />
                  : <Copy  size={14} color="rgba(245,232,210,0.55)" />
                }
                onPress={copy}
              />
            </View>
          </Card.Body>
        </Card>

        {/* Stats — two-up, hairline-divided */}
        <View className="mt-5 flex-row rounded-card overflow-hidden border border-line">
          <View className="flex-1 p-4 bg-bg">
            <Text variant="eyebrow" tone="muted">MEMBERS</Text>
            <Text variant="hudMd" className="mt-1" tabular>{league.members}</Text>
          </View>
          <View className="w-px bg-line" />
          <View className="flex-1 p-4 bg-bg">
            <Text variant="eyebrow" tone="muted">CREATED</Text>
            <Text className="mt-1 font-display font-bold text-[22px] leading-[30px]">
              {league.created}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-5 pb-6">
        <Button
          label="Go to today's matches"
          variant="primary"
          size="lg"
          fullWidth
          onPress={onContinue}
        />
      </View>
    </SafeAreaView>
  );
}
