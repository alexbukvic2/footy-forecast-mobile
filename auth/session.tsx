import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getStoredSession, storeTokens, clearTokens, type StoredSession } from './storage';

interface SessionContextValue {
  session: StoredSession | null;
  isLoading: boolean;
  signIn: (tokens: StoredSession) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function signIn(tokens: StoredSession) {
    await storeTokens(tokens);
    setSession(tokens);
  }

  async function signOut() {
    await clearTokens();
    setSession(null);
  }

  return (
    <SessionContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (ctx === null) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
