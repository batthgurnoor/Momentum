import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(uid) {
  return `momentum_onboarding_v1_done_${uid}`;
}

export async function isOnboardingComplete(uid) {
  if (!uid) return true;
  try {
    const v = await AsyncStorage.getItem(storageKey(uid));
    return v === '1';
  } catch {
    return true;
  }
}

export async function markOnboardingComplete(uid) {
  if (!uid) return;
  try {
    await AsyncStorage.setItem(storageKey(uid), '1');
  } catch {
    /* ignore */
  }
}
