import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteField,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../Firebase/config';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;
const WH = COLORS.workoutHome;

const defaultAvatar = require('../../assets/images/avatar.png');

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const user = auth.currentUser;

  const profilePhotoStoragePath = user ? `profilePictures/${user.uid}.jpg` : null;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        return;
      }
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
  }, [user]);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoadingActivities(false);
      return;
    }
    const activitiesRef = collection(db, 'users', user.uid, 'activities');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setActivities(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
        setLoadingActivities(false);
      },
      (error) => {
        console.log('Activity snapshot error:', error);
        setLoadingActivities(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
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
      Alert.alert('Could not save', error?.message ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const ensurePickerPermission = async (source) => {
    if (source === 'library') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to choose a profile picture.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
        return false;
      }
    }
    return true;
  };

  const pickProfileImage = async (source) => {
    if (!user) return null;
    const ok = await ensurePickerPermission(source);
    if (!ok) return null;
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    };
    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync(options)
        : await ImagePicker.launchCameraAsync(options);
    if (result.canceled || !result.assets?.[0]) return null;
    return result.assets[0];
  };

  const uploadProfilePhoto = async (asset) => {
    if (!user || !profilePhotoStoragePath) return;
    setUploadingPhoto(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, profilePhotoStoragePath);
      const contentType = asset.mimeType || 'image/jpeg';
      await uploadBytes(storageRef, blob, { contentType });
      const url = await getDownloadURL(storageRef);
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { photoURL: url }, { merge: true });
      setProfile((p) => (p ? { ...p, photoURL: url } : p));
    } catch (error) {
      console.log('Profile photo upload error:', error);
      Alert.alert('Could not update photo', error?.message ?? 'Try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeProfilePhoto = async () => {
    if (!user || !profilePhotoStoragePath) return;
    setUploadingPhoto(true);
    try {
      try {
        await deleteObject(ref(storage, profilePhotoStoragePath));
      } catch {
        /* file may not exist */
      }
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, { photoURL: deleteField() }, { merge: true });
      setProfile((p) => (p ? { ...p, photoURL: '' } : p));
    } catch (error) {
      console.log('Profile photo remove error:', error);
      Alert.alert('Could not remove photo', error?.message ?? 'Try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openPhotoOptions = () => {
    if (!user || uploadingPhoto) return;
    const buttons = [
      {
        text: 'Photo library',
        onPress: async () => {
          const asset = await pickProfileImage('library');
          if (asset) await uploadProfilePhoto(asset);
        },
      },
      {
        text: 'Camera',
        onPress: async () => {
          const asset = await pickProfileImage('camera');
          if (asset) await uploadProfilePhoto(asset);
        },
      },
    ];
    if (profile?.photoURL) {
      buttons.push({
        text: 'Remove photo',
        style: 'destructive',
        onPress: removeProfilePhoto,
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile photo', 'Choose a source', buttons);
  };

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || 'Your profile';

  if (!user) {
    return (
      <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.pageHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.profileHeaderTitle}>Profile</Text>
              <Text style={[styles.pageSub, { color: WH.textDim, marginTop: 6 }]}>
                Sign in to view and edit your profile.
              </Text>
            </View>
            <View style={[styles.iconCircle, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
              <Ionicons name="person-outline" size={22} color={WH.accent} />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.mutedBody}>You are not signed in.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.screen}>
        <SafeAreaView style={[styles.safe, styles.centered]}>
          <ActivityIndicator size="large" color={APP.accent} />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const recent = activities.slice(0, 4);

  return (
    <LinearGradient colors={[APP.bgTop, APP.bgMid, APP.bgBottom]} locations={[0, 0.45, 1]} style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 8}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.pageHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.profileHeaderTitle}>Profile</Text>
              </View>
              <View style={[styles.iconCircle, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
                <Ionicons name="person-circle-outline" size={24} color={WH.accent} />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.profileRow}>
                <TouchableOpacity
                  style={styles.avatarWrap}
                  onPress={openPhotoOptions}
                  activeOpacity={0.88}
                  disabled={uploadingPhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                >
                  <Image
                    source={profile.photoURL ? { uri: profile.photoURL } : defaultAvatar}
                    style={styles.avatar}
                  />
                  {uploadingPhoto ? (
                    <View style={styles.avatarLoading}>
                      <ActivityIndicator color={COLORS.text.onPrimary} />
                    </View>
                  ) : null}
                  <View style={styles.avatarEditBadge}>
                    <Ionicons name="camera" size={14} color={COLORS.text.onPrimary} />
                  </View>
                </TouchableOpacity>
                <View style={styles.profileMeta}>
                  <Text style={styles.cardTitle}>{displayName}</Text>
                  <Text style={styles.emailText} numberOfLines={2}>
                    {profile.email || user.email}
                  </Text>
                </View>
              </View>

              <View style={styles.vitalsRow}>
                <View style={styles.vital}>
                  <Text style={styles.vitalLabel}>Height</Text>
                  <Text style={styles.vitalValue}>{profile.height || 0} cm</Text>
                </View>
                <View style={styles.vitalDivider} />
                <View style={styles.vital}>
                  <Text style={styles.vitalLabel}>Weight</Text>
                  <Text style={styles.vitalValue}>{profile.weight || 0} kg</Text>
                </View>
                <View style={styles.vitalDivider} />
                <View style={styles.vital}>
                  <Text style={styles.vitalLabel}>Phone</Text>
                  <Text style={styles.vitalValue} numberOfLines={1}>
                    {profile.phone || '—'}
                  </Text>
                </View>
              </View>

              {!editing ? (
                <View style={styles.actionsGrid}>
                  <TouchableOpacity
                    style={styles.actionPrimary}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Notifications')}
                  >
                    <Ionicons name="notifications-outline" size={18} color={COLORS.text.onPrimary} />
                    <Text style={styles.actionPrimaryText}>Notifications</Text>
                  </TouchableOpacity>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.actionSecondary}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('Calculation')}
                    >
                      <Text style={styles.actionSecondaryText}>BMI</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionSecondary}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('Metrics')}
                    >
                      <Text style={styles.actionSecondaryText}>Metrics</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionSecondary}
                      activeOpacity={0.9}
                      onPress={() => setEditing(true)}
                    >
                      <Text style={[styles.actionSecondaryText, { color: APP.accent }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.actionGhost}
                    activeOpacity={0.9}
                    onPress={() => setEditing(false)}
                    disabled={saving}
                  >
                    <Text style={styles.actionGhostText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionPrimary, { flex: 1, marginTop: 0 }]}
                    activeOpacity={0.9}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={COLORS.text.onPrimary} size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.text.onPrimary} />
                        <Text style={styles.actionPrimaryText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {editing ? (
              <View style={styles.card}>
                <Text style={[styles.sectionHeading, { marginBottom: 12 }]}>Update details</Text>
                <Field label="First name" />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={APP.textDim}
                  value={profile.firstName}
                  onChangeText={(t) => setProfile({ ...profile, firstName: t })}
                />
                <Field label="Last name" />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={APP.textDim}
                  value={profile.lastName}
                  onChangeText={(t) => setProfile({ ...profile, lastName: t })}
                />
                <Field label="Phone" />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={APP.textDim}
                  keyboardType="phone-pad"
                  value={profile.phone}
                  onChangeText={(t) => setProfile({ ...profile, phone: t })}
                />
                <Field label="Height (cm)" />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={APP.textDim}
                  keyboardType="numeric"
                  value={String(profile.height)}
                  onChangeText={(t) => setProfile({ ...profile, height: t })}
                />
                <Field label="Weight (kg)" />
                <TextInput
                  style={styles.input}
                  placeholderTextColor={APP.textDim}
                  keyboardType="numeric"
                  value={String(profile.weight)}
                  onChangeText={(t) => setProfile({ ...profile, weight: t })}
                />
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeading}>Recent activity</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('ActivityMonitoring')}>
                  <Text style={styles.linkText}>View all</Text>
                </TouchableOpacity>
              </View>
              {loadingActivities ? (
                <ActivityIndicator color={APP.accent} style={{ marginVertical: 16 }} />
              ) : recent.length === 0 ? (
                <Text style={styles.mutedBody}>No sessions logged yet.</Text>
              ) : (
                recent.map((item, idx) => {
                  const dateStr = item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : '—';
                  return (
                    <View
                      key={item.id}
                      style={[styles.activityRow, idx === 0 && styles.activityRowFirst]}
                    >
                      <View style={styles.activityDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle} numberOfLines={1}>
                          {item.title || 'Session'}
                        </Text>
                        <Text style={styles.activityMeta}>{dateStr}</Text>
                        {item.duration != null ? (
                          <Text style={styles.activityMeta}>Duration: {item.duration} min</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field({ label }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingBottom: 36 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.text.secondary, marginTop: 12, fontWeight: '600' },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  profileHeaderTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: WH.accent,
  },
  pageSub: {
    fontSize: 13,
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  card: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  cardTitle: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 18,
  },
  emailText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  mutedBody: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: APP.accent,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: APP.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: APP.bgMid,
  },
  profileMeta: {
    flex: 1,
    marginLeft: 14,
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: APP.cardBorder,
  },
  vital: { flex: 1, alignItems: 'center' },
  vitalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: APP.cardBorder,
    marginHorizontal: 4,
  },
  vitalLabel: {
    color: COLORS.text.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  vitalValue: {
    color: COLORS.text.primary,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 6,
  },
  actionsGrid: { marginTop: 18, gap: 10 },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: APP.accent,
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionPrimaryText: {
    color: COLORS.text.onPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionSecondary: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP.cardBorder,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
  },
  actionSecondaryText: {
    color: COLORS.text.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  actionGhost: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP.cardBorder,
  },
  actionGhostText: {
    color: COLORS.text.secondary,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionHeading: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 16,
  },
  linkText: {
    color: APP.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  fieldLabel: {
    color: COLORS.text.secondary,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1,
    borderColor: APP.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text.primary,
    fontSize: 15,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: APP.cardBorder,
  },
  activityRowFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: APP.accent,
    marginTop: 6,
    marginRight: 12,
    opacity: 0.85,
  },
  activityTitle: {
    color: COLORS.text.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  activityMeta: {
    color: COLORS.text.tertiary,
    fontSize: 12,
    marginTop: 2,
  },
});
