import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../theme/authStyles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.replace('ProfileSetup'); 
    } catch (error) {
      Alert.alert('Signup Error', error.message);
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
            <Text style={authStyles.formLabel}>Create Account</Text>
            
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
              onPress={handleSignup} 
              style={[authStyles.signupButton, { backgroundColor: '#4CAF50' }]}
            >
              <Text style={{ color: COLORS.text.onPrimary, textAlign: 'center', fontWeight: '600' }}>Sign Up</Text>
            </TouchableOpacity>

            <View style={authStyles.loginLink}>
              <Text style={authStyles.loginText}>
                Already have an account?{' '}
                <Text 
                  style={authStyles.loginHighlight}
                  onPress={() => navigation.navigate('Login')}
                >
                  Log In
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}