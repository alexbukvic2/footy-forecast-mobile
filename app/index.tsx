import { Redirect } from 'expo-router';
import { useSession } from '@/auth/session';

export default function Index() {
  const { session, isLoading } = useSession();
  if (isLoading) return null;
  return <Redirect href={session ? '/(tabs)' : '/sign-in'} />;
}
