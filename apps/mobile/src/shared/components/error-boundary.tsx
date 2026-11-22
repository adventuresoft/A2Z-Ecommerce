import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { analytics } from '../analytics';
import { azColors, spacing } from '../theme';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    analytics.captureError(error, { componentStack: info.componentStack });
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="global.errorBoundary">
          <Text variant="headlineSmall" style={styles.title}>
            Something went wrong
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            We have logged this error automatically. Please try reloading.
          </Text>
          <Button
            mode="contained"
            onPress={this.handleReset}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Reload App
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: azColors.page,
  },
  title: {
    color: azColors.navy,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: azColors.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.lg,
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
});
