import { Redirect } from "expo-router";
import { useSession } from "@/auth/session";

export default function Index() {
  const { session, isLoading } = useSession();

  // Wait for SecureStore to hydrate before deciding where to go.
  if (isLoading) return null;

  return <Redirect href={session ? "/(tabs)" : "/sign-in"} />;
}
