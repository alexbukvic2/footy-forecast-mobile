import { Tabs, Redirect } from 'expo-router';
import { Home, Users } from 'lucide-react-native';
import { useLeagues } from '@/hooks/useLeagues';

const ACTIVE = '#D86B3D';
const INACTIVE = 'rgba(245,232,210,0.35)';
const TAB_BG = '#130D09';

export default function TabsLayout() {
  const { data: leagues, isPending, isFetching } = useLeagues();

  if (isPending) return null;

  if (!isFetching && (leagues?.length ?? 0) === 0) {
    return <Redirect href="/(leagues)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopColor: 'rgba(245,232,210,0.08)',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: 'Leagues',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
