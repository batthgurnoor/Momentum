import raw from '../../exercise_data.json';

/**
 * exercise_data.json may contain repeated rows (same gif, different ids).
 * Train / routines / session picker should use this list so each move appears once.
 */
function dedupeByGifUrl(list) {
  const seen = new Set();
  return list.filter((e) => {
    const key = String(e.gif_url || '')
      .trim()
      .toLowerCase();
    const dedupeKey = key || `id:${e.id}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

export const EXERCISE_CATALOG = dedupeByGifUrl(Array.isArray(raw) ? raw : []);
