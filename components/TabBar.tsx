import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Trophy, Target, type LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/ui';

export interface TabSpec {
  /** Matches the route name in `app/(tabs)/<id>.tsx`. */
  id: string;
  label: string;
  Icon: LucideIcon;
}

export const TABS: TabSpec[] = [
  { id: 'leagues', label: 'Leagues', Icon: Trophy },
  { id: 'predict', label: 'Predict',  Icon: Target },
  { id: 'profile', label: 'Profile',  Icon: User   },
];

export interface TabBarProps {
  active: string;
  onChange: (id: string) => void;
  /** Override TABS for tests. Defaults to the module constant. */
  tabs?: TabSpec[];
}

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
      <View className="w-10 h-6 items-center justify-center">
        {active ? (
          <View className="absolute inset-0 rounded-pill bg-brand-soft" />
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
