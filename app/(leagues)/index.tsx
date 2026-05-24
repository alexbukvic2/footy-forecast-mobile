import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui';

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

function PlusIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D86B3D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#D86B3D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 11l3 3 8-8" />
      <Path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7" />
    </Svg>
  );
}

export default function ChooserScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <WarmTopGlow />

      {/* Wordmark */}
      <View className="px-5 pt-3">
        <Wordmark />
      </View>

      {/* Body */}
      <View className="flex-1 px-6 pt-12">
        <Text className="font-mono text-eyebrow uppercase text-brand-500 tracking-widest">
          ROSTER · EMPTY
        </Text>
        <Text className="mt-3 font-display font-bold text-ink leading-tight" style={{ fontSize: 42, lineHeight: 42 }}>
          {"You're in.\n"}
          <Text className="text-brand-500" style={{ fontSize: 42 }}>Now pick a side.</Text>
        </Text>

        {/* Choice cards */}
        <View className="mt-8 flex-row gap-3">
          <View className="flex-1 rounded-card border border-line p-4 bg-surface/40">
            <View className="w-10 h-10 rounded-card bg-brand-soft items-center justify-center mb-3">
              <PlusIcon />
            </View>
            <Text className="font-display font-bold text-[15px] text-ink leading-tight">Start one</Text>
            <Text className="mt-1 text-[12px] text-ink-dim leading-snug">{"You'll get a code to share."}</Text>
          </View>
          <View className="flex-1 rounded-card border border-line p-4 bg-surface/40">
            <View className="w-10 h-10 rounded-card bg-brand-soft items-center justify-center mb-3">
              <CheckIcon />
            </View>
            <Text className="font-display font-bold text-[15px] text-ink leading-tight">Got a code?</Text>
            <Text className="mt-1 text-[12px] text-ink-dim leading-snug">Six letters from a friend.</Text>
          </View>
        </View>
      </View>

      {/* CTAs */}
      <View className="px-5 pb-10 gap-3">
        <View
          className="w-full h-14 rounded-pill bg-brand-500 items-center justify-center"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 6 }}
        >
          <Text
            className="font-semibold text-[15px] text-ink-invert"
            onPress={() => router.push('/(leagues)/create')}
          >
            Create a league
          </Text>
        </View>
        <View className="w-full h-14 rounded-pill bg-surface-raised border border-line items-center justify-center">
          <Text
            className="font-semibold text-[15px] text-ink"
            onPress={() => router.push('/(leagues)/join')}
          >
            Join with code
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
