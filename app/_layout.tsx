import "../global.css";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { SessionProvider, useSession } from "@/auth/session";
import { registerSignOutHandler } from "@/api/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGateway() {
  const { session, isLoading, signOut } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    registerSignOutHandler(signOut);
  }, [signOut]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments.at(0) === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [session, isLoading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AuthGateway />
      </SessionProvider>
    </QueryClientProvider>
  );
}