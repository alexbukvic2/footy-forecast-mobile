import { getStoredSession, clearTokens } from '@/auth/storage';
import { refreshSession } from '@/auth/refresh';
import { API_BASE_URL } from './config';

// Register this callback in the root layout so the client can trigger
// a sign-out without depending on React context.
let onSignOutRequired: (() => void) | null = null;
export function registerSignOutHandler(handler: () => void): void {
  onSignOutRequired = handler;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getIdToken(): Promise<string | null> {
  const session = await getStoredSession();
  if (!session) return null;

  // Refresh proactively when less than 60 s remain
  if (session.expiresAt - Date.now() < 60_000) {
    try {
      const refreshed = await refreshSession(session.refreshToken);
      return refreshed.idToken;
    } catch {
      await clearTokens();
      onSignOutRequired?.();
      return null;
    }
  }

  return session.idToken;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getIdToken();

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && token) {
    // Attempt one token refresh then retry
    const session = await getStoredSession();
    if (session) {
      let newToken: string;
      try {
        const refreshed = await refreshSession(session.refreshToken);
        newToken = refreshed.idToken;
      } catch {
        await clearTokens();
        onSignOutRequired?.();
        throw new ApiError(401, 'Session expired');
      }

      headers.set('Authorization', `Bearer ${newToken}`);
      const retried = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      if (!retried.ok) {
        if (retried.status === 401) {
          await clearTokens();
          onSignOutRequired?.();
        }
        throw new ApiError(retried.status, `API error ${retried.status}`);
      }
      return retried.json() as Promise<T>;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}
