import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f4f4f4' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>
        Create an Account
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        onChangeText={setEmail}
        value={email}
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TouchableOpacity onPress={handleSignup} style={{ backgroundColor: 'green', padding: 16, borderRadius: 8 }}>
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigati2on.navigate('Login')} style={{ marginTop: 16 }}>
        <Text style={{ textAlign: 'center' }}>
          Already have an account? 
          <Text style={{ color: 'blue' }}> Log In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
