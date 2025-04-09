import { StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from './constants';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text.primary,
  },
  input: {
    backgroundColor: 'white',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
  },
  button: {
    backgroundColor: COLORS.primary.default,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    ...SHADOWS.small,
  },
  buttonText: {
    color: COLORS.text.onPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
    textAlign: 'center',
    color: COLORS.text.primary,
  },
});

// Export individual styles for backward compatibility
export const styles = commonStyles; 