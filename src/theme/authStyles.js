import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from './constants';
import { commonStyles } from './styles';

const { width } = Dimensions.get('window');

// Memoize background decorations to prevent recalculation
const backgroundDecorations = {
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    top: -width * 0.4,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
};

export const authStyles = StyleSheet.create({
  ...commonStyles,
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ...backgroundDecorations,
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary.light,
    ...SHADOWS.medium,
  },
  appName: {
    color: COLORS.text.onPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  appNameFull: {
    color: COLORS.text.onPrimary,
    marginTop: SPACING.sm,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  tagline: {
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  formCard: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: 'rgba(44, 62, 80, 0.8)',
    borderRadius: BORDER_RADIUS.lg,
  },
  form: {
    width: '100%',
  },
  formLabel: {
    marginBottom: SPACING.lg,
    color: COLORS.text.onPrimary,
    textAlign: 'center',
    fontSize: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text.onPrimary,
    height: '100%',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.md,
    height: '100%',
    justifyContent: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  errorText: {
    color: COLORS.ui.error,
    marginLeft: SPACING.xs,
  },
  signupButton: {
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary.default,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  loginLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.text.secondary,
  },
  loginHighlight: {
    color: COLORS.primary.light,
    fontWeight: 'bold',
  },
}); 