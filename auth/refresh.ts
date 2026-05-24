import { getCognitoClientId, getCognitoDomain } from './config';
import { storeTokens, type StoredSession } from './storage';

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function refreshSession(currentRefreshToken: string): Promise<StoredSession> {
  const domain = getCognitoDomain();
  const clientId = getCognitoClientId();

  const res = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: currentRefreshToken,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  const data = (await res.json()) as TokenResponse;

  const session: StoredSession = {
    accessToken: data.access_token,
    idToken: data.id_token,
    // Cognito only returns a new refresh token on first auth; reuse the existing one
    refreshToken: data.refresh_token ?? currentRefreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  await storeTokens(session);
  return session;
}
