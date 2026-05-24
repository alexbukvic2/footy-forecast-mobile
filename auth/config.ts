import Constants from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';

interface CognitoExtra {
  cognitoClientId: string;
  cognitoDomain: string;
  awsRegion: string;
}

function getExtra(): CognitoExtra {
  const raw: unknown = Constants.expoConfig?.extra;
  if (
    typeof raw !== 'object' ||
    raw === null ||
    typeof (raw as Record<string, unknown>)['cognitoClientId'] !== 'string' ||
    typeof (raw as Record<string, unknown>)['cognitoDomain'] !== 'string'
  ) {
    throw new Error('Missing Cognito config — check app.config.ts and .env.local');
  }
  return raw as CognitoExtra;
}

export function getCognitoClientId(): string {
  return getExtra().cognitoClientId;
}

export function getCognitoDomain(): string {
  return getExtra().cognitoDomain;
}

export const COGNITO_REDIRECT_URI = makeRedirectUri({
  scheme: 'footy-forecast',
  path: 'callback',
});

export function getDiscovery() {
  const domain = getCognitoDomain();
  return {
    authorizationEndpoint: `${domain}/oauth2/authorize`,
    tokenEndpoint: `${domain}/oauth2/token`,
    revocationEndpoint: `${domain}/oauth2/revoke`,
  };
}
