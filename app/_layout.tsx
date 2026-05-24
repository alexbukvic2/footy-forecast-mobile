import "../global.css";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot } from "expo-router";
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
  const { signOut } = useSession();

  useEffect(() => {
    registerSignOutHandler(signOut);
  }, [signOut]);

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