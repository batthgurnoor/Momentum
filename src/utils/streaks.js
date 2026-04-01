function dateKeyLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d, delta) {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}

/**
 * Compute current and best streak from activity docs.
 * Expects each activity to have `timestamp` as Firestore Timestamp (or Date-like).
 */
export function computeStreaks(activities) {
  const keys = new Set();

  for (const a of activities || []) {
    const ts = a?.timestamp;
    const dt =
      ts?.toDate?.() ??
      (ts instanceof Date ? ts : null);
    if (!dt) continue;
    keys.add(dateKeyLocal(dt));
  }

  if (keys.size === 0) return { current: 0, best: 0 };

  const sorted = Array.from(keys).sort(); // YYYY-MM-DD lexicographic == chronological

  // Best streak
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const cur = new Date(`${sorted[i]}T00:00:00`);
    const diffDays = Math.round((cur - prev) / 86400000);
    if (diffDays === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  // Current streak: count back from today if present, else yesterday if present
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKeyLocal(today);
  const start = keys.has(todayKey) ? today : addDays(today, -1);
  const startKey = dateKeyLocal(start);
  if (!keys.has(startKey)) return { current: 0, best };

  let current = 0;
  let cursor = start;
  while (keys.has(dateKeyLocal(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best };
}

