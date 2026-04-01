import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;

const bannerImage = require('../../assets/images/fitnessBanner.jpg');
const defaultAvatar = require('../../assets/images/avatar.png');

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        } else {
          setProfile({
            firstName: '',
            lastName: '',
            phone: '',
            email: user.email,
            height: 0,
            weight: 0,
          });
        }
      } catch (error) {
        console.log('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!user) return;
    const activitiesRef = collection(db, 'users', user.uid, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(list);
        setLoadingActivities(false);
      },
      (error) => {
        console.log('Activity snapshot error:', error);
        setLoadingActivities(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user || !profile) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        height: parseFloat(profile.height) || 0,
        weight: parseFloat(profile.weight) || 0,
      });
      setEditing(false);
    } catch (error) {
      console.log('Error updating profile:', error);
    }
  };

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-momentum-bg">
        <ActivityIndicator size="large" color={APP.accent} />
        <Text className="text-ui-text-secondary mt-2">Loading Profile...</Text>
      </View>
    );
  }

  const ActivityCard = ({ item }) => {
    const dateStr = item.timestamp?.toDate
      ? item.timestamp.toDate().toLocaleString()
      : 'N/A';

    return (
      <View className="rounded-xl p-4 mb-3 border border-momentum-border bg-ui-card">
        <Text className="text-lg font-bold text-ui-text-primary">{item.title}</Text>
        <Text className="text-sm text-ui-text-secondary">{dateStr}</Text>
        {item.duration ? (
          <Text className="text-sm mt-1 text-ui-text-secondary">Duration: {item.duration} min</Text>
        ) : null}
        {item.caloriesBurned ? (
          <Text className="text-sm text-ui-text-secondary">Calories: {item.caloriesBurned}</Text>
        ) : null}
        {item.notes ? <Text className="text-sm text-ui-text-tertiary">Notes: {item.notes}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-momentum-bg">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="h-40 w-full">
          <ImageBackground
            source={bannerImage}
            resizeMode="cover"
            className="flex-1 justify-end"
          >
            <View className="flex-row items-center px-4 py-3 bg-black/50">
              <Text className="text-white font-bold text-2xl">Welcome!</Text>
            </View>
          </ImageBackground>
        </View>

        <View className="-mt-14 px-4">
          <View className="rounded-2xl p-4 border border-momentum-border bg-ui-card">
            <View className="flex-row">
              <Image
                source={defaultAvatar}
                className="w-24 h-24 rounded-full border-2 border-primary -mt-3"
              />
              <View className="ml-4 flex-1 justify-center">
                <Text className="text-xl font-bold text-ui-text-primary">
                  {profile.firstName || 'First'} {profile.lastName || 'Last'}
                </Text>
                <Text className="text-sm text-ui-text-secondary">
                  {profile.email || user.email}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-4">
              <View className="flex-1 items-center">
                <Text className="text-xs text-ui-text-tertiary">Height</Text>
                <Text className="text-base font-semibold text-ui-text-primary">
                  {profile.height || 0} cm
                </Text>
              </View>
              <View className="w-[1px] bg-momentum-border mx-2" />
              <View className="flex-1 items-center">
                <Text className="text-xs text-ui-text-tertiary">Weight</Text>
                <Text className="text-base font-semibold text-ui-text-primary">
                  {profile.weight || 0} kg
                </Text>
              </View>
              <View className="w-[1px] bg-momentum-border mx-2" />
              <View className="flex-1 items-center">
                <Text className="text-xs text-ui-text-tertiary">Phone</Text>
                <Text className="text-base font-semibold text-ui-text-primary">
                  {profile.phone || 'N/A'}
                </Text>
              </View>
            </View>

            <View className="mt-4">
              {!editing ? (
                <View className="flex-row justify-between flex-wrap gap-2">
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Notifications')}
                    className="bg-primary py-2 px-4 rounded-full"
                  >
                    <Text className="text-momentum-bg font-bold">Notifications</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Calculation')}
                    className="bg-ui-surface border border-momentum-border py-2 px-4 rounded-full"
                  >
                    <Text className="text-ui-text-primary font-bold">BMI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Metrics')}
                    className="bg-ui-surface border border-momentum-border py-2 px-4 rounded-full"
                  >
                    <Text className="text-ui-text-primary font-bold">Metrics</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditing(true)}
                    className="bg-ui-surface border border-momentum-border py-2 px-4 rounded-full"
                  >
                    <Text className="text-primary font-bold">Edit Profile</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleSave}
                  className="bg-primary py-2 px-4 rounded-full self-end"
                >
                  <Text className="text-momentum-bg font-bold">Save Changes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {editing && (
          <View className="mx-4 mt-4 p-4 rounded-xl border border-momentum-border bg-ui-card">
            <Text className="text-lg font-semibold mb-2 text-ui-text-primary">Update Details</Text>
            <Text className="text-ui-text-secondary">First Name</Text>
            <TextInput
              className="bg-ui-surface px-3 py-2 rounded-lg mb-2 text-ui-text-primary border border-momentum-border"
              placeholderTextColor={APP.textDim}
              value={profile.firstName}
              onChangeText={(t) => setProfile({ ...profile, firstName: t })}
            />
            <Text className="text-ui-text-secondary">Last Name</Text>
            <TextInput
              className="bg-ui-surface px-3 py-2 rounded-lg mb-2 text-ui-text-primary border border-momentum-border"
              placeholderTextColor={APP.textDim}
              value={profile.lastName}
              onChangeText={(t) => setProfile({ ...profile, lastName: t })}
            />
            <Text className="text-ui-text-secondary">Phone</Text>
            <TextInput
              className="bg-ui-surface px-3 py-2 rounded-lg mb-2 text-ui-text-primary border border-momentum-border"
              placeholderTextColor={APP.textDim}
              keyboardType="phone-pad"
              value={profile.phone}
              onChangeText={(t) => setProfile({ ...profile, phone: t })}
            />
            <Text className="text-ui-text-secondary">Height (cm)</Text>
            <TextInput
              className="bg-ui-surface px-3 py-2 rounded-lg mb-2 text-ui-text-primary border border-momentum-border"
              placeholderTextColor={APP.textDim}
              keyboardType="numeric"
              value={String(profile.height)}
              onChangeText={(t) => setProfile({ ...profile, height: t })}
            />
            <Text className="text-ui-text-secondary">Weight (kg)</Text>
            <TextInput
              className="bg-ui-surface px-3 py-2 rounded-lg mb-2 text-ui-text-primary border border-momentum-border"
              placeholderTextColor={APP.textDim}
              keyboardType="numeric"
              value={String(profile.weight)}
              onChangeText={(t) => setProfile({ ...profile, weight: t })}
            />
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
