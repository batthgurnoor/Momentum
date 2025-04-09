import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../Firebase/config'; 
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../theme/authStyles';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

export default function ProfileSetupScreen() {
  const navigation = useNavigation();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [height, setHeight]       = useState('');
  const [weight, setWeight]       = useState('');

  const user = auth.currentUser;
  const email = user?.email || '';

  // Optionally, if you want to check if profile data already exists:
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) return;
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setPhone(data.phone || '');
          setHeight(data.height?.toString() || '');
          setWeight(data.weight?.toString() || '');
        }
      } catch (error) {
        console.log('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const saveProfile = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'No current user found.');
        return;
      }

      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        firstName,
        lastName,
        phone,
        email,
        // Convert height/weight to numbers if desired:
        height: parseFloat(height) || 0,
        weight: parseFloat(weight) || 0,
      });

      Alert.alert('Profile saved', 'Your profile has been updated.');
      // Navigate to your main app or profile tab
      navigation.replace('TabNav'); 
      // or if you want them to see their new profile in a tab
    } catch (error) {
      Alert.alert('Error', error.message);
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
            <Text style={authStyles.tagline}>Complete your profile to get started</Text>
          </View>

          <View style={authStyles.formCard}>
            <Text style={authStyles.formLabel}>Complete Your Profile</Text>
            
            {/* Email (read-only) */}
            <View style={authStyles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                value={email}
                editable={false}
                style={[authStyles.input, { color: COLORS.text.secondary }]}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="First Name"
                placeholderTextColor={COLORS.text.tertiary}
                value={firstName}
                onChangeText={setFirstName}
                style={authStyles.input}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor={COLORS.text.tertiary}
                value={lastName}
                onChangeText={setLastName}
                style={authStyles.input}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor={COLORS.text.tertiary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={authStyles.input}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Ionicons name="resize-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="Height (e.g. 170 in cm)"
                placeholderTextColor={COLORS.text.tertiary}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                style={authStyles.input}
              />
            </View>

            <View style={authStyles.inputContainer}>
              <Ionicons name="scale-outline" size={20} color={COLORS.primary.light} style={authStyles.inputIcon} />
              <TextInput
                placeholder="Weight (e.g. 65 in kg)"
                placeholderTextColor={COLORS.text.tertiary}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                style={authStyles.input}
              />
            </View>

            <TouchableOpacity
              onPress={saveProfile}
              style={[authStyles.signupButton, { backgroundColor: '#4CAF50' }]}
            >
              <Text style={{ color: COLORS.text.onPrimary, textAlign: 'center', fontWeight: '600' }}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
