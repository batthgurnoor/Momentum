import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../Firebase/config'; 
import { useNavigation } from '@react-navigation/native';

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
    <View style={{ flex: 1, backgroundColor: '#f0f0f0', padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        Complete Your Profile
      </Text>

      {/* Email (read-only) */}
      <TextInput
        value={email}
        editable={false}
        style={{ backgroundColor: '#e0e0e0', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Height (e.g. 170 in cm)"
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Weight (e.g. 65 in kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        style={{ backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <TouchableOpacity
        onPress={saveProfile}
        style={{ backgroundColor: 'blue', padding: 16, borderRadius: 8, marginTop: 16 }}
      >
        <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}
