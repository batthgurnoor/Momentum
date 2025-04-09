import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../theme/authStyles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function LoginScreen() {
  const navigation = useNavigation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Log in with Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // If successful, user is now signed in; redirect to main app
      navigation.replace('TabNav'); 
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  return (
    <View style={authStyles.container}>
      <View style={authStyles.backgroundDecoration}>
        <View style={authStyles.circle1} />
        <View style={authStyles.circle2} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={authStyles.keyboardView}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent}>
          <View style={authStyles.logoContainer}>
            <View style={authStyles.logoBackground}>
              <Image 
                source={require('../../assets/images/momentum.png')} 
                style={{ width: 50, height: 50, resizeMode: 'contain' }}
              />
            </View>
            <Text style={authStyles.appName}>Momentum</Text>
            <Text style={authStyles.tagline}>Your journey to better health starts here</Text>
          </View>

          <View style={authStyles.formCard}>
            <Text style={authStyles.formLabel}>Welcome Back</Text>
            
            <View style={authStyles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor={COLORS.text.tertiary}
                autoCapitalize="none"
                onChangeText={setEmail}
                value={email}
                style={authStyles.input}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={COLORS.text.tertiary}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                value={password}
                style={[authStyles.input, authStyles.passwordInput]}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={authStyles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.primary.light} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleLogin} 
              style={authStyles.signupButton}
            >
              <Text style={{ color: COLORS.text.onPrimary, textAlign: 'center', fontWeight: '600' }}>Log In</Text>
            </TouchableOpacity>

            <View style={authStyles.loginLink}>
              <Text style={authStyles.loginText}>
                Don't have an account?{' '}
                <Text 
                  style={authStyles.loginHighlight}
                  onPress={() => navigation.navigate('Signup')}
                >
                  Sign Up
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}