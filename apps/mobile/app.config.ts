import type { ConfigContext, ExpoConfig } from 'expo/config';

type AppEnv = 'development' | 'staging' | 'production';

const APP_ENV = (process.env.APP_ENV || process.env.EXPO_PUBLIC_APP_ENV || 'development') as AppEnv;

const ENV_MATRIX: Record<
  AppEnv,
  {
    name: string;
    androidPackage: string;
    iosBundleId: string;
    scheme: string;
    webDomain: string;
    usesCleartextTraffic: boolean;
  }
> = {
  development: {
    name: 'AZ Shop Dev',
    androidPackage: 'com.atozecommerce.app.dev',
    iosBundleId: 'com.atozecommerce.app.dev',
    scheme: 'azecommerce-dev',
    webDomain: 'localhost',
    usesCleartextTraffic: true,
  },
  staging: {
    name: 'AZ Shop Staging',
    androidPackage: 'com.atozecommerce.app.staging',
    iosBundleId: 'com.atozecommerce.app.staging',
    scheme: 'azecommerce-staging',
    webDomain: 'staging.atozecommerce.com',
    usesCleartextTraffic: false,
  },
  production: {
    name: 'A to Z Ecommerce',
    androidPackage: 'com.atozecommerce.app',
    iosBundleId: 'com.atozecommerce.app',
    scheme: 'azecommerce',
    webDomain: 'atozecommerce.com',
    usesCleartextTraffic: false,
  },
};

const envConfig = ENV_MATRIX[APP_ENV] ?? ENV_MATRIX.development;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: envConfig.name,
  slug: 'a-to-z-ecommerce',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: [envConfig.scheme, 'azecommerce'],
  userInterfaceStyle: 'light',
  runtimeVersion: {
    policy: 'appVersion',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: envConfig.iosBundleId,
    associatedDomains:
      APP_ENV === 'development' ? [] : [`applinks:${envConfig.webDomain}`],
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: APP_ENV === 'development',
      },
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
      ],
    },
  },
  android: {
    package: envConfig.androidPackage,
    adaptiveIcon: {
      backgroundColor: '#1D4ED8',
    },
    permissions: ['POST_NOTIFICATIONS'],
    intentFilters:
      APP_ENV === 'development'
        ? []
        : [
            {
              action: 'VIEW',
              autoVerify: true,
              data: [
                { scheme: 'https', host: envConfig.webDomain, pathPrefix: '/product/' },
                { scheme: 'https', host: envConfig.webDomain, pathPrefix: '/category/' },
                { scheme: 'https', host: envConfig.webDomain, pathPrefix: '/collection/' },
                { scheme: 'https', host: envConfig.webDomain, pathPrefix: '/orders/' },
                { scheme: 'https', host: envConfig.webDomain, pathPrefix: '/track/' },
                {
                  scheme: 'https',
                  host: envConfig.webDomain,
                  pathPrefix: '/checkout/payment-callback',
                },
              ],
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#1D4ED8',
      },
    ],
    [
      'expo-notifications',
      {
        color: '#1D4ED8',
      },
    ],
    [
      '@sentry/react-native/expo',
      {
        organization: process.env.SENTRY_ORG || 'az-ecommerce',
        project: process.env.SENTRY_PROJECT || 'az-ecommerce-mobile',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appEnv: APP_ENV,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || '00000000-0000-0000-0000-000000000000',
    },
  },
  updates: {
    enabled: APP_ENV !== 'development',
    fallbackToCacheTimeout: 0,
  },
});
