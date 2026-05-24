import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'footy-forecast-mobile',
  slug: config.slug ?? 'footy-forecast-mobile',
  // Override the default slug-based scheme — Cognito redirect is registered as footy-forecast://
  scheme: 'footy-forecast',
  extra: {
    ...(config.extra ?? {}),
    cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ?? '',
    cognitoDomain: process.env.EXPO_PUBLIC_COGNITO_DOMAIN ?? '',
    awsRegion: process.env.EXPO_PUBLIC_AWS_REGION ?? '',
  },
});
