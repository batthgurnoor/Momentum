import { Image } from 'react-native';
import exerciseData from '../../exercise_data.json';
import { getCachedDownloadUrl } from './storageUrlCache';

/**
 * Resolve Firebase Storage download URL for an exercise GIF (same rules as Train / Category screens).
 */
export async function resolveExerciseGifUrl(intensity, fileName) {
  if (!fileName) return null;
  const tier = String(intensity || 'Moderate').trim() || 'Moderate';
  const paths = [`${tier}Exercises/${fileName}`, `AllExercises/${fileName}`];
  for (const path of paths) {
    try {
      return await getCachedDownloadUrl(path);
    } catch {
      // try alternate storage layout
    }
  }
  return null;
}

/**
 * Warm URL cache + native image cache for all library exercises (deduped).
 * Safe to call on app start; failures are ignored per item.
 */
export async function preloadExerciseGifUrls({ concurrency = 6 } = {}) {
  const seen = new Set();
  const pairs = [];
  for (const ex of exerciseData) {
    const gif = ex.gif_url;
    if (!gif) continue;
    const key = `${ex.intensity}|${gif}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ intensity: ex.intensity, gif });
  }

  if (!pairs.length) return;

  let cursor = 0;

  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= pairs.length) break;
      const { intensity, gif } = pairs[i];
      try {
        const uri = await resolveExerciseGifUrl(intensity, gif);
        if (uri && typeof Image.prefetch === 'function') {
          await Image.prefetch(uri);
        }
      } catch {
        // ignore
      }
    }
  }

  const pool = Math.min(concurrency, pairs.length);
  await Promise.all(Array.from({ length: pool }, () => worker()));
}
