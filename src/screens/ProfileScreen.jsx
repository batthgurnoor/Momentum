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
  Modal,
  Pressable,
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
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { signOut, deleteUser } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '../../Firebase/config';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

const APP = COLORS.app;
const WH = COLORS.workoutHome;

const defaultAvatar = require('../../assets/images/avatar.png');

/** Top-level collections under users/{uid} that should be removed when deleting an account. */
const USER_DATA_SUBCOLLECTIONS = ['activities', 'sessions', 'metrics', 'routines', 'workoutPlans'];

async function deleteFirestoreCollectionDocs(db, collectionRef) {
  const snapshot = await getDocs(collectionRef);
  if (snapshot.empty) return;
  let batch = writeBatch(db);
  let count = 0;
  const commits = [];
  for (const d of snapshot.docs) {
    batch.delete(d.ref);
    count += 1;
    if (count >= 500) {
      commits.push(batch.commit());
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) commits.push(batch.commit());
  await Promise.all(commits);
}

function formatActivityDuration(seconds) {
  if (seconds == null || seconds === '') return null;
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return null;
  if (s < 60) return `${Math.round(s)}s`;
  const minutes = Math.floor(s / 60);
  const remainingSeconds = Math.round(s % 60);
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatActivityWhen(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startToday - startThat) / 86400000);
  const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (dayDiff === 0) return `Today · ${timeStr}`;
  if (dayDiff === 1) return `Yesterday · ${timeStr}`;
  if (dayDiff > 1 && dayDiff < 7) {
    return `${date.toLocaleDateString(undefined, { weekday: 'short' })} · ${timeStr}`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` · ${timeStr}`;
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const closePhotoPicker = () => setPhotoPickerVisible(false);

  const openPhotoOptions = () => {
    if (!user || uploadingPhoto) return;
    setPhotoPickerVisible(true);
  };

  /** Close themed sheet first so the native image UI can open cleanly on iOS/Android. */
  const runAfterPhotoSheetClose = (fn) => {
    closePhotoPicker();
    setTimeout(fn, 320);
  };

  const handlePhotoLibraryPick = () => {
    if (uploadingPhoto) return;
    runAfterPhotoSheetClose(async () => {
      const asset = await pickProfileImage('library');
      if (asset) await uploadProfilePhoto(asset);
    });
  };

  const handlePhotoCameraPick = () => {
    if (uploadingPhoto) return;
    runAfterPhotoSheetClose(async () => {
      const asset = await pickProfileImage('camera');
      if (asset) await uploadProfilePhoto(asset);
    });
  };

  const handleRemovePhotoFromSheet = () => {
    closePhotoPicker();
    removeProfilePhoto();
  };

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim() || 'Your profile';

  const resetNavigationToLogin = () => {
    const reset = CommonActions.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    let nav = navigation;
    for (let i = 0; i < 5 && nav; i++) {
      const state = nav.getState?.();
      if (state?.routeNames?.includes('Login')) {
        nav.dispatch(reset);
        return;
      }
      nav = nav.getParent();
    }
    navigation.dispatch(reset);
  };

  const performDeleteAccount = async () => {
    const u = auth.currentUser;
    if (!u) return;
    setDeletingAccount(true);
    try {
      for (const name of USER_DATA_SUBCOLLECTIONS) {
        const colRef = collection(db, 'users', u.uid, name);
        await deleteFirestoreCollectionDocs(db, colRef);
      }
      try {
        await deleteObject(ref(storage, `profilePictures/${u.uid}.jpg`));
      } catch {
        /* no profile image */
      }
      await deleteDoc(doc(db, 'users', u.uid));
      await AsyncStorage.removeItem('notificationPreferences');
      await deleteUser(u);
      resetNavigationToLogin();
    } catch (error) {
      console.log('Delete account error:', error);
      const code = error?.code;
      if (code === 'auth/requires-recent-login') {
        Alert.alert(
          'Sign in again',
          'For security, please log out, log back in, and try deleting your account again.'
        );
      } else {
        Alert.alert('Could not delete account', error?.message ?? 'Try again later.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = () => {
    if (!user || saving || deletingAccount) return;
    Alert.alert(
      'Delete account?',
      'This permanently removes your profile, workouts, plans, and metrics. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your data in Momentum will be erased.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete my account', style: 'destructive', onPress: performDeleteAccount },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            resetNavigationToLogin();
          } catch (error) {
            console.log('Logout error:', error);
            Alert.alert('Could not log out', error?.message ?? 'Try again.');
          }
        },
      },
    ]);
  };

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
              <TouchableOpacity
                style={[styles.logoutHeaderBtn, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}
                onPress={handleLogout}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                <Ionicons name="log-out-outline" size={20} color={WH.accent} />
                <Text style={[styles.logoutHeaderText, { color: WH.accent }]}>Log out</Text>
              </TouchableOpacity>
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

                <View style={styles.deleteAccountBlock}>
                  <Text style={styles.deleteAccountTitle}>Danger zone</Text>
                  <Text style={styles.deleteAccountCopy}>
                    Permanently delete your account and all workouts, routines, plans, and metrics stored in Momentum.
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteAccountBtn}
                    activeOpacity={0.88}
                    onPress={confirmDeleteAccount}
                    disabled={saving || deletingAccount}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <Text style={styles.deleteAccountBtnText}>Delete account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.activityCardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.activityEyebrow}>Your training</Text>
                  <Text style={styles.activitySectionTitle}>Recent activity</Text>
                  {!loadingActivities && recent.length > 0 ? (
                    <Text style={styles.activitySectionHint}>Last {recent.length} sessions</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.activityViewAllBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('ActivityMonitoring')}
                >
                  <Text style={styles.linkText}>View all</Text>
                  <Ionicons name="chevron-forward" size={16} color={APP.accent} />
                </TouchableOpacity>
              </View>

              {loadingActivities ? (
                <View style={styles.activityLoadingWrap}>
                  <ActivityIndicator color={APP.accent} />
                  <Text style={styles.activityLoadingText}>Loading activity…</Text>
                </View>
              ) : recent.length === 0 ? (
                <View style={styles.activityEmpty}>
                  <View style={[styles.activityEmptyIcon, { borderColor: WH.cardBorder, backgroundColor: WH.accentMuted }]}>
                    <Ionicons name="barbell-outline" size={28} color={WH.accent} />
                  </View>
                  <Text style={styles.activityEmptyTitle}>No sessions yet</Text>
                  <Text style={styles.activityEmptySub}>Finish a workout and it will show up here.</Text>
                  <TouchableOpacity
                    style={[styles.activityEmptyCta, { borderColor: APP.cardBorder, backgroundColor: 'rgba(0,0,0,0.22)' }]}
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('Train')}
                  >
                    <Ionicons name="flash-outline" size={18} color={APP.accent} />
                    <Text style={styles.activityEmptyCtaText}>Go to Train</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.activityList}>
                  {recent.map((item, idx) => {
                    const dur = formatActivityDuration(item.duration);
                    const cals = Number(item.caloriesBurned);
                    const hasCals = Number.isFinite(cals) && cals > 0;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.activityItem,
                          { borderColor: APP.cardBorder },
                          idx === recent.length - 1 && styles.activityItemLast,
                        ]}
                        onPress={() => navigation.navigate('ActivityMonitoring')}
                        activeOpacity={0.88}
                      >
                        <View style={[styles.activityItemIcon, { backgroundColor: WH.accentMuted }]}>
                          <Ionicons name="fitness-outline" size={20} color={WH.accent} />
                        </View>
                        <View style={styles.activityItemBody}>
                          <Text style={styles.activityItemTitle} numberOfLines={1}>
                            {item.title || 'Session'}
                          </Text>
                          <Text style={styles.activityItemWhen}>{formatActivityWhen(item.timestamp)}</Text>
                          {(dur || hasCals) ? (
                            <View style={styles.activityItemMetaRow}>
                              {dur ? (
                                <View style={[styles.activityPill, { borderColor: APP.cardBorder }]}>
                                  <Ionicons name="time-outline" size={13} color={APP.textMuted} />
                                  <Text style={styles.activityPillText}>{dur}</Text>
                                </View>
                              ) : null}
                              {hasCals ? (
                                <View style={[styles.activityPill, { borderColor: APP.cardBorder }]}>
                                  <Ionicons name="flame-outline" size={13} color={APP.textMuted} />
                                  <Text style={styles.activityPillText}>{Math.round(cals)} kcal</Text>
                                </View>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={APP.textDim} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={closePhotoPicker}
      >
        <Pressable style={styles.photoPickerBackdrop} onPress={closePhotoPicker}>
          <Pressable style={styles.photoPickerCardWrap} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[APP.bgTop, APP.bgMid, APP.bgBottom]}
              locations={[0, 0.45, 1]}
              style={styles.photoPickerGradient}
            >
              <View style={styles.photoPickerHeader}>
                <Text style={styles.photoPickerTitle}>Choose a profile picture</Text>
                <TouchableOpacity
                  onPress={closePhotoPicker}
                  style={styles.photoPickerClose}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={26} color={APP.text} />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoPickerSubtitle}>Pick a source for your photo</Text>

              <TouchableOpacity
                style={[styles.photoPickerRow, { borderColor: APP.cardBorder }]}
                onPress={handlePhotoLibraryPick}
                activeOpacity={0.88}
                disabled={uploadingPhoto}
              >
                <View style={[styles.photoPickerRowIcon, { backgroundColor: WH.accentMuted }]}>
                  <Ionicons name="images-outline" size={22} color={WH.accent} />
                </View>
                <Text style={styles.photoPickerRowLabel}>Photo library</Text>
                <Ionicons name="chevron-forward" size={20} color={APP.textDim} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoPickerRow, { borderColor: APP.cardBorder }]}
                onPress={handlePhotoCameraPick}
                activeOpacity={0.88}
                disabled={uploadingPhoto}
              >
                <View style={[styles.photoPickerRowIcon, { backgroundColor: WH.accentMuted }]}>
                  <Ionicons name="camera-outline" size={22} color={WH.accent} />
                </View>
                <Text style={styles.photoPickerRowLabel}>Camera</Text>
                <Ionicons name="chevron-forward" size={20} color={APP.textDim} />
              </TouchableOpacity>

              {profile?.photoURL ? (
                <TouchableOpacity
                  style={[styles.photoPickerRow, styles.photoPickerRowDanger, { borderColor: APP.cardBorder }]}
                  onPress={handleRemovePhotoFromSheet}
                  activeOpacity={0.88}
                  disabled={uploadingPhoto}
                >
                  <View style={[styles.photoPickerRowIcon, { backgroundColor: 'rgba(248,113,113,0.18)' }]}>
                    <Ionicons name="trash-outline" size={22} color={COLORS.ui.error} />
                  </View>
                  <Text style={[styles.photoPickerRowLabel, { color: COLORS.ui.error }]}>Remove photo</Text>
                  <Ionicons name="chevron-forward" size={20} color={APP.textDim} />
                </TouchableOpacity>
              ) : null}
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
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
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutHeaderText: {
    fontWeight: '800',
    fontSize: 13,
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
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activityEyebrow: {
    color: COLORS.text.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  activitySectionTitle: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  activitySectionHint: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  activityViewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 18,
  },
  activityLoadingWrap: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  activityLoadingText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  activityEmpty: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  activityEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  activityEmptyTitle: {
    color: COLORS.text.primary,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 6,
  },
  activityEmptySub: {
    color: COLORS.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 260,
  },
  activityEmptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  activityEmptyCtaText: {
    color: APP.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
    marginBottom: 10,
  },
  activityItemLast: {
    marginBottom: 0,
  },
  activityItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityItemBody: {
    flex: 1,
    minWidth: 0,
  },
  activityItemTitle: {
    color: COLORS.text.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  activityItemWhen: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  activityItemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  activityPillText: {
    color: APP.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  photoPickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  photoPickerCardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: APP.cardBorder,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  photoPickerGradient: {
    padding: 18,
    paddingTop: 16,
  },
  photoPickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  photoPickerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: WH.accent,
    letterSpacing: -0.3,
    paddingTop: 2,
  },
  photoPickerClose: {
    marginTop: -4,
    marginRight: -4,
    padding: 4,
  },
  photoPickerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
    gap: 12,
  },
  photoPickerRowDanger: {
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  photoPickerRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerRowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  deleteAccountBlock: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: APP.cardBorder,
  },
  deleteAccountTitle: {
    color: COLORS.ui.error,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  deleteAccountCopy: {
    color: COLORS.text.secondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.ui.error,
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteAccountBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
