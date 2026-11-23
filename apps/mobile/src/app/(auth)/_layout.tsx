import React from 'react';
import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function AuthGroupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
