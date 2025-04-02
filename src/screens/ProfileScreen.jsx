import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  Image,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const bannerImage = require('../../assets/images/fitnessBanner.jpg'); // <- example path
const defaultAvatar = require('../../assets/images/avatar.png'); // <- example path

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false); // toggles edit mode

  // For activity logs
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const user = auth.currentUser;

  // 1) Load user profile doc
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setProfile(snapshot.data());
        } else {
          // If doc doesn't exist, set a default object so we can fill fields
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

  // 2) Real-time load the user's activities
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

  // 3) Handle updating profile
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

  // If profile isn't loaded yet, show spinner
  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="gray" />
        <Text className="text-gray-500 mt-2">Loading Profile...</Text>
      </View>
    );
  }

  // A custom ActivityCard for the list
  const ActivityCard = ({ item }) => {
    const dateStr = item.timestamp?.toDate
      ? item.timestamp.toDate().toLocaleString()
      : 'N/A';

    return (
      <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <Text className="text-lg font-bold">{item.title}</Text>
        <Text className="text-sm text-gray-600">{dateStr}</Text>
        {item.duration ? (
          <Text className="text-sm mt-1">Duration: {item.duration} min</Text>
        ) : null}
        {item.caloriesBurned ? (
          <Text className="text-sm">Calories: {item.caloriesBurned}</Text>
        ) : null}
        {item.notes ? <Text className="text-sm">Notes: {item.notes}</Text> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner Section */}
        <View className="h-40 w-full">
          <ImageBackground
            source={bannerImage}
            resizeMode="cover"
            className="flex-1 justify-end"
          >
            <View className="flex-row items-center px-4 py-2 bg-black/30">
              <Text className="text-white font-bold text-2xl">Welcome!</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Profile Header Card */}
        <View className="-mt-14 px-4">
          {/* White Card */}
          <View className="bg-white rounded-2xl shadow-md p-4">
            {/* Avatar + Name Row */}
            <View className="flex-row">
              <Image
                source={defaultAvatar}
                className="w-24 h-24 rounded-full border-2 border-white -mt-3"
              />
              <View className="ml-4 flex-1 justify-center">
                <Text className="text-xl font-bold text-gray-800">
                  {profile.firstName || 'First'} {profile.lastName || 'Last'}
                </Text>
                <Text className="text-sm text-gray-500">
                  {profile.email || user.email}
                </Text>
              </View>
            </View>

            {/* Stats Row (Height/Weight/Phone) */}
            <View className="flex-row justify-between mt-4">
              {/* Height */}
              <View className="flex-1 items-center">
                <Text className="text-xs text-gray-500">Height</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {profile.height || 0} cm
                </Text>
              </View>
              {/* Divider */}
              <View className="w-[1px] bg-gray-300 mx-2" />
              {/* Weight */}
              <View className="flex-1 items-center">
                <Text className="text-xs text-gray-500">Weight</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {profile.weight || 0} kg
                </Text>
              </View>
              {/* Divider */}
              <View className="w-[1px] bg-gray-300 mx-2" />
              {/* Phone */}
              <View className="flex-1 items-center">
                <Text className="text-xs text-gray-500">Phone</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {profile.phone || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Edit/Save Button */}
            <View className="mt-4">
              {!editing ? (
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  className="bg-indigo-500 py-2 px-4 rounded-full self-end"
                >
                  <Text className="text-white font-semibold">Edit Profile</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSave}
                  className="bg-green-500 py-2 px-4 rounded-full self-end"
                >
                  <Text className="text-white font-semibold">Save Changes</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Editable Section (appears if editing) */}
        {editing && (
          <View className="mx-4 mt-4 bg-white p-4 rounded-xl shadow-sm">
            <Text className="text-lg font-semibold mb-2">Update Details</Text>
            <Text className="text-gray-600">First Name</Text>
            <TextInput
              className="bg-gray-100 px-3 py-2 rounded-lg mb-2"
              value={profile.firstName}
              onChangeText={(t) => setProfile({ ...profile, firstName: t })}
            />
            <Text className="text-gray-600">Last Name</Text>
            <TextInput
              className="bg-gray-100 px-3 py-2 rounded-lg mb-2"
              value={profile.lastName}
              onChangeText={(t) => setProfile({ ...profile, lastName: t })}
            />
            <Text className="text-gray-600">Phone</Text>
            <TextInput
              className="bg-gray-100 px-3 py-2 rounded-lg mb-2"
              keyboardType="phone-pad"
              value={profile.phone}
              onChangeText={(t) => setProfile({ ...profile, phone: t })}
            />
            <Text className="text-gray-600">Height (cm)</Text>
            <TextInput
              className="bg-gray-100 px-3 py-2 rounded-lg mb-2"
              keyboardType="numeric"
              value={String(profile.height)}
              onChangeText={(t) => setProfile({ ...profile, height: t })}
            />
            <Text className="text-gray-600">Weight (kg)</Text>
            <TextInput
              className="bg-gray-100 px-3 py-2 rounded-lg mb-2"
              keyboardType="numeric"
              value={String(profile.weight)}
              onChangeText={(t) => setProfile({ ...profile, weight: t })}
            />
          </View>
        )}

        {/* Activity History Section */}
        <View className="mt-4 mx-4 mb-6">
          <Text className="text-xl font-bold mb-2 text-gray-800">
            Activity History
          </Text>
          {loadingActivities ? (
            <ActivityIndicator size="large" color="gray" />
          ) : activities.length === 0 ? (
            <Text className="text-gray-600">No activity found.</Text>
          ) : (
            <FlatList
              data={activities}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ActivityCard item={item} />}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
