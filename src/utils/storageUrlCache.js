import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../Firebase/config';

const CACHE_PREFIX = 'dlurl:';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function keyFor(path) {
  return `${CACHE_PREFIX}${path}`;
}

export async function getCachedDownloadUrl(path, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const key = keyFor(path);

  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      const url = parsed?.url;
      const savedAt = parsed?.savedAt;
      if (typeof url === 'string' && typeof savedAt === 'number') {
        if (Date.now() - savedAt < ttlMs) return url;
      }
    }
  } catch {
    // ignore cache read/parse errors and refetch
  }

  const url = await getDownloadURL(ref(storage, path));
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ url, savedAt: Date.now() }));
  } catch {
    // ignore cache write errors
  }
  return url;
}

export async function invalidateCachedDownloadUrl(path) {
  try {
    await AsyncStorage.removeItem(keyFor(path));
  } catch {
    // ignore
  }
}

