import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'ff_access_token',
  idToken: 'ff_id_token',
  refreshToken: 'ff_refresh_token',
  expiresAt: 'ff_expires_at',
} as const;

export interface StoredSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number; // ms since epoch
}

export async function storeTokens(session: StoredSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
    SecureStore.setItemAsync(KEYS.idToken, session.idToken),
    SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
    SecureStore.setItemAsync(KEYS.expiresAt, String(session.expiresAt)),
  ]);
}

export async function getStoredSession(): Promise<StoredSession | null> {
  const [accessToken, idToken, refreshToken, expiresAtStr] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.idToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.expiresAt),
  ]);

  if (!accessToken || !refreshToken) return null;

  return {
    accessToken,
    idToken: idToken ?? '',
    refreshToken,
    expiresAt: expiresAtStr !== null ? Number(expiresAtStr) : 0,
  };
}

export async function clearTokens(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  );
}
