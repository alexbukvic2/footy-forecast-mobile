import { Tabs, Redirect } from 'expo-router';
import { TabBar } from '@/components/TabBar';
import { useLeagues } from '@/hooks/useLeagues';

export default function TabsLayout() {
  const { data: leagues, isPending, isFetching } = useLeagues();

  if (isPending) return null;

  if (!isFetching && (leagues?.length ?? 0) === 0) {
    return <Redirect href="/(leagues)" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      initialRouteName="leagues"
      tabBar={(props) => {
        const route = props.state.routes[props.state.index];
        return (
          <TabBar
            active={route?.name ?? 'leagues'}
            onChange={(id) => props.navigation.navigate(id)}
          />
        );
      }}
    >
      <Tabs.Screen name="leagues" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
