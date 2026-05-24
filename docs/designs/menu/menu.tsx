/**
 * app/(tabs)/_layout.tsx — Bottom tab bar
 *
 * DESIGN REFERENCE, not drop-in code. Wire it to expo-router's Tabs layout
 * with a custom `tabBar` render prop. The screens themselves (profile.tsx,
 * leagues.tsx, …) live as siblings under `app/(tabs)/`.
 *
 * Shape of the integration in `app/(tabs)/_layout.tsx`:
 *
 *     import { Tabs } from 'expo-router';
 *     import { TabBar, TABS } from './_tab-bar';
 *
 *     export default function TabsLayout() {
 *       return (
 *         <Tabs
 *           screenOptions={{ headerShown: false }}
 *           tabBar={(props) => (
 *             <TabBar
 *               active={props.state.routes[props.state.index].name}
 *               onChange={(id) => props.navigation.navigate(id)}
 *             />
 *           )}
 *         >
 *           <Tabs.Screen name="profile" />
 *           <Tabs.Screen name="leagues" />
 *         </Tabs>
 *       );
 *     }
 *
 * Adding a third tab (e.g. `today`) is one entry in TABS + one Tabs.Screen.
 */

import type { ComponentType } from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Trophy, type LucideIcon } from 'lucide-react-native';

import { Text } from '../../components/ui';

// ────────────────────────────────────────────────────────────────────
// Tabs
// ────────────────────────────────────────────────────────────────────

export interface TabSpec {
  /** Matches the route name in `app/(tabs)/<id>.tsx`. */
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const TABS: TabSpec[] = [
  { id: 'profile', label: 'Profile', Icon: User   },
  { id: 'leagues', label: 'Leagues', Icon: Trophy },
];

// ────────────────────────────────────────────────────────────────────
// TabBar
// ────────────────────────────────────────────────────────────────────

export interface TabBarProps {
  active: string;
  onChange: (id: string) => void;
  /** Override TABS for tests / Storybook. Defaults to the module constant. */
  tabs?: TabSpec[];
}

/**
 * Floating bottom tab bar — sits above the home indicator rather than
 * edge-to-edge, with the home-indicator padding pulled from
 * `useSafeAreaInsets()` so it adapts per-device.
 *
 * Active cue is a Material-3-style pill: a small `brand-soft` backplate
 * behind the icon plus a color shift on icon + label. Either alone would
 * do; both together makes the active state pre-cognitive.
 *
 * Labels use the eyebrow type scale (mono uppercase, 10.5px, tracking
 * 0.18em) to match the rest of the app's taxonomy-label voice.
 */
export function TabBar({ active, onChange, tabs = TABS }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: Math.max(insets.bottom, 12),
        paddingHorizontal: 12,
      }}
    >
      <View
        className="flex-row rounded-tab bg-surface-raised border border-line"
        style={{
          height: 64,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.55,
          shadowRadius: 28,
          elevation: 12,
        }}
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            active={tab.id === active}
            onPress={() => onChange(tab.id)}
          />
        ))}
      </View>
    </View>
  );
}

interface TabButtonProps {
  tab: TabSpec;
  active: boolean;
  onPress: () => void;
}

function TabButton({ tab, active, onPress }: TabButtonProps) {
  const { Icon } = tab;
  const color = active ? '#D86B3D' : 'rgba(245,232,210,0.55)';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      className="flex-1 items-center justify-center"
      hitSlop={4}
    >
      {/* Icon + brand-soft active backplate */}
      <View className="w-10 h-6 items-center justify-center">
        {active ? (
          <View
            className="absolute inset-0 rounded-pill bg-brand-soft"
          />
        ) : null}
        <Icon size={20} color={color} strokeWidth={active ? 2.1 : 1.7} />
      </View>

      <Text
        className="mt-1 font-mono uppercase text-[10px] tracking-[0.18em]"
        style={{ color, lineHeight: 12 }}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}
