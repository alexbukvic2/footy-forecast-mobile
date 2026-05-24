import { Tabs } from 'expo-router';
import { Redirect } from 'expo-router';
import { useLeagues } from '@/hooks/useLeagues';

export default function TabsLayout() {
  const { data: leagues, isPending, isFetching } = useLeagues();

  // Wait for the first load before deciding
  if (isPending) return null;

  // Only redirect when the fetch has settled and the list is genuinely empty.
  // Skipping this check while isFetching prevents a redirect loop right after
  // create/join, when the cache briefly shows the old empty array.
  if (!isFetching && (leagues?.length ?? 0) === 0) {
    return <Redirect href="/(leagues)" />;
  }

  return <Tabs screenOptions={{ headerShown: false }} />;
}
