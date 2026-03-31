import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from './constants';
import { commonStyles } from './styles';

const { width } = Dimensions.get('window');
const APP = COLORS.app;

const backgroundDecorations = {
  circle1: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    top: -width * 0.42,
    right: -width * 0.22,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: 'rgba(45, 212, 191, 0.06)',
    bottom: -width * 0.28,
    left: -width * 0.32,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP.accentMuted,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    ...SHADOWS.medium,
  },
  appName: {
    color: APP.text,
    fontSize: 32,
    fontWeight: 'bold',
  },
  appNameFull: {
    color: APP.text,
    marginTop: SPACING.sm,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  tagline: {
    color: APP.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  formCard: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: 'rgba(18, 21, 31, 0.92)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  form: {
    width: '100%',
  },
  formLabel: {
    marginBottom: SPACING.lg,
    color: APP.text,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    height: 52,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: APP.text,
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
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  errorText: {
    color: COLORS.ui.error,
    marginLeft: SPACING.xs,
  },
  signupButton: {
    marginTop: SPACING.sm,
    backgroundColor: APP.accent,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.medium,
  },
  loginLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  loginText: {
    color: APP.textMuted,
  },
  loginHighlight: {
    color: APP.accent,
    fontWeight: 'bold',
  },
});
