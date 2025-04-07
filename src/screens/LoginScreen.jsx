import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  Animated,
  Dimensions 
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import { Text } from '../components/ui/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const navigation = useNavigation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Stagger animations for a more pleasing effect
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ]).start();
  }, []);

  // Log in with Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // If successful, user is now signed in; redirect to main app
      navigation.replace('TabNav'); 
    } catch (error) {
      // Handle error with visual feedback
      console.log(error.message);
      setErrorMsg('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={COLORS.gradient.dark}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* Background decorative elements */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          {/* Replace with your actual logo image */}
          <LinearGradient
            colors={[COLORS.primary.default, COLORS.secondary.default]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBackground}
          >
            <Text variant="headingLarge" style={styles.appName}>M</Text>
          </LinearGradient>
          <Text variant="headingLarge" style={styles.appNameFull}>MOMENTUM</Text>
          <Text variant="bodyMedium" style={styles.tagline}>Your fitness journey starts here</Text>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            width: '100%'
          }}
        >
          <Card variant="glass" style={styles.formCard}>
            <View style={styles.form}>
              <Text variant="labelLarge" style={styles.formLabel}>Welcome back</Text>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={COLORS.text.tertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  value={email}
                  style={styles.input}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={COLORS.text.tertiary}
                  secureTextEntry={secureTextEntry}
                  onChangeText={setPassword}
                  value={password}
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity 
                  onPress={() => setSecureTextEntry(!secureTextEntry)} 
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons 
                    name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={COLORS.text.tertiary} 
                  />
                </TouchableOpacity>
              </View>

              {errorMsg ? (
                <View style={styles.errorContainer}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.ui.error} />
                  <Text variant="bodySmall" style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <Button 
                label="Log In" 
                variant="primary" 
                isFullWidth 
                useGradient
                onPress={handleLogin}
                isLoading={isLoading}
                style={styles.loginButton}
              />

              <TouchableOpacity style={styles.forgotPassword}>
                <Text variant="bodySmall" style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.signupLink}>
                <Text variant="bodyMedium" style={styles.signupText}>
                  Don't have an account?
                  <Text variant="bodyMedium" style={styles.signupHighlight}> Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    top: -width * 0.4,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    bottom: -width * 0.3,
    left: -width * 0.3,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
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
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  appName: {
    color: COLORS.text.primary,
    fontSize: 36,
  },
  appNameFull: {
    color: COLORS.text.primary,
    letterSpacing: 1.5,
  },
  tagline: {
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  formCard: {
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    ...SHADOWS.medium,
  },
  form: {
    width: '100%',
  },
  formLabel: {
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ui.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    padding: SPACING.md,
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: SPACING.xl,
  },
  eyeIcon: {
    padding: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  errorText: {
    color: COLORS.ui.error,
    marginLeft: SPACING.xs,
  },
  loginButton: {
    marginTop: SPACING.sm,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginTop: SPACING.sm,
  },
  forgotPasswordText: {
    color: COLORS.primary.light,
  },
  signupLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.text.secondary,
  },
  signupHighlight: {
    color: COLORS.primary.default,
  },
});
