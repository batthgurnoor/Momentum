import { COLORS } from './colors';

export const styles = {
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: COLORS.text.primary,
  },
  passwordInput: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primary.default,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 16,
    color: COLORS.text.secondary,
  },
  linkTextHighlight: {
    color: COLORS.primary.default,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.gradient.dark[0],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.text.primary,
  },
}; 