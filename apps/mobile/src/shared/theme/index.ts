import { MD3LightTheme, useTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const azColors = {
  primary: '#1D4ED8',
  primaryHover: '#1E40AF',
  primarySoft: '#EFF6FF',
  navy: '#0F172A',
  navyDark: '#070D19',
  accent: '#EA580C',
  accentText: '#C2410C', // WCAG AA safe >= 4.5:1 on white
  accentSoft: '#FFF7ED',
  page: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  disabled: '#94A3B8',
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
} as const;

export interface AppTheme extends MD3Theme {
  custom: {
    colors: typeof azColors;
    spacing: typeof spacing;
    radius: typeof radius;
  };
}

export const azLightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,
    primary: azColors.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: azColors.primarySoft,
    onPrimaryContainer: azColors.primaryHover,
    secondary: azColors.navy,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E2E8F0',
    onSecondaryContainer: azColors.navy,
    tertiary: azColors.accent,
    onTertiary: '#FFFFFF',
    tertiaryContainer: azColors.accentSoft,
    onTertiaryContainer: azColors.accentText,
    background: azColors.page,
    onBackground: azColors.navy,
    surface: azColors.surface,
    onSurface: azColors.navy,
    surfaceVariant: '#F1F5F9',
    onSurfaceVariant: azColors.muted,
    outline: '#CBD5E1',
    outlineVariant: azColors.border,
    error: azColors.danger,
    onError: '#FFFFFF',
    errorContainer: azColors.dangerSoft,
    onErrorContainer: '#991B1B',
  },
  custom: {
    colors: azColors,
    spacing,
    radius,
  },
};

export function useAppTheme(): AppTheme {
  return useTheme<AppTheme>();
}
