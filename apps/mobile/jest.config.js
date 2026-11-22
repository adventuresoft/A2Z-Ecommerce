/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/maestro/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@repo/api-client$': '<rootDir>/../../packages/api-client/src/index.ts',
    '^@repo/api-client/(.*)$': '<rootDir>/../../packages/api-client/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-paper|react-native-vector-icons|@gorhom/bottom-sheet|@shopify/flash-list|@tanstack/.*|zustand|posthog-react-native))',
  ],
};
