import {
  writeBatch,
  doc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../Firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_SESSION_KEY = 'session:pendingFirestoreWrite';
const MAX_ATTEMPTS = 4;
const DELAYS_MS = [0, 400, 1200, 2800];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function aggregateSession(sessionExercises) {
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  for (const ex of sessionExercises) {
    for (const s of ex.sets || []) {
      const reps = parseInt(String(s.reps ?? ''), 10);
      const weight = parseFloat(String(s.weight ?? ''));
      if (Number.isFinite(reps)) totalReps += reps;
      if (Number.isFinite(reps)) totalSets += 1;
      if (Number.isFinite(reps) && Number.isFinite(weight)) totalVolume += reps * weight;
    }
  }
  return {
    sets: totalSets,
    reps: totalReps,
    volume: Number(totalVolume.toFixed(2)),
  };
}

function mapExercisesForFirestore(sessionExercises) {
  return sessionExercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    title: ex.title,
    intensity: ex.intensity,
    category: ex.category,
    sets: (ex.sets || []).map((s) => ({
      reps: s.reps === '' ? null : Number(s.reps),
      weight: s.weight === '' ? null : Number(s.weight),
      rpe: s.rpe === '' ? null : Number(s.rpe),
      restSeconds: typeof s.restSeconds === 'number' ? s.restSeconds : null,
      timestamp: s.createdAt ? new Date(s.createdAt) : null,
    })),
  }));
}

/**
 * Build session + activity documents for Firestore (uses serverTimestamp).
 */
export function buildSessionFirestoreDocuments({
  title,
  totalSeconds,
  calories,
  notes,
  startTimestamp,
  restTargetSeconds,
  sessionExercises,
  endTimeMs,
}) {
  const totals = aggregateSession(sessionExercises);
  const exercises = mapExercisesForFirestore(sessionExercises);
  const end = endTimeMs != null ? new Date(endTimeMs) : new Date();

  const sessionPayload = {
    title: title || 'Training Session',
    timestamp: serverTimestamp(),
    duration: totalSeconds,
    caloriesBurned: parseFloat(calories) || 0,
    notes: notes || '',
    startTime: startTimestamp ? new Date(startTimestamp) : null,
    endTime: end,
    restTargetSeconds: restTargetSeconds || 0,
    totals,
    exercises,
    source: 'session',
    schemaVersion: 2,
  };

  const activityPayload = {
    title: title || 'Training Session',
    timestamp: serverTimestamp(),
    duration: totalSeconds,
    caloriesBurned: parseFloat(calories) || 0,
    notes: notes || '',
    startTime: startTimestamp ? new Date(startTimestamp) : null,
    endTime: end,
    totals,
    source: 'session',
  };

  return { sessionPayload, activityPayload };
}

/**
 * JSON-safe snapshot (for offline queue). Keeps original end time when replaying.
 */
export function buildSessionWriteSnapshot({
  title,
  totalSeconds,
  calories,
  notes,
  startTimestamp,
  restTargetSeconds,
  sessionExercises,
  endTimeMs,
}) {
  const totals = aggregateSession(sessionExercises);
  return {
    v: 1,
    title: title || 'Training Session',
    duration: totalSeconds,
    calories: parseFloat(calories) || 0,
    notes: notes || '',
    startTimestamp: startTimestamp ?? null,
    restTargetSeconds: restTargetSeconds || 0,
    sessionExercises,
    totals,
    endTimeMs: endTimeMs ?? Date.now(),
  };
}

function firestorePayloadsFromSnapshot(snap) {
  const exercises = mapExercisesForFirestore(snap.sessionExercises);
  const startTime = snap.startTimestamp ? new Date(snap.startTimestamp) : null;
  const endTime = new Date(snap.endTimeMs);

  const sessionPayload = {
    title: snap.title,
    timestamp: serverTimestamp(),
    duration: snap.duration,
    caloriesBurned: snap.calories,
    notes: snap.notes,
    startTime,
    endTime,
    restTargetSeconds: snap.restTargetSeconds || 0,
    totals: snap.totals,
    exercises,
    source: 'session',
    schemaVersion: 2,
  };

  const activityPayload = {
    title: snap.title,
    timestamp: serverTimestamp(),
    duration: snap.duration,
    caloriesBurned: snap.calories,
    notes: snap.notes,
    startTime,
    endTime,
    totals: snap.totals,
    source: 'session',
  };

  return { sessionPayload, activityPayload };
}

/**
 * Atomic write: session doc + activity summary, or neither.
 */
export async function commitSessionWriteBatch(userId, sessionPayload, activityPayload) {
  let lastError;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (DELAYS_MS[attempt]) await sleep(DELAYS_MS[attempt]);
    try {
      const batch = writeBatch(db);
      const sessionRef = doc(collection(db, 'users', userId, 'sessions'));
      const activityRef = doc(collection(db, 'users', userId, 'activities'));
      batch.set(sessionRef, sessionPayload);
      batch.set(activityRef, activityPayload);
      await batch.commit();
      return { ok: true };
    } catch (e) {
      lastError = e;
    }
  }
  return { ok: false, error: lastError };
}

export async function queueFailedSessionWrite(userId, snapshot) {
  try {
    await AsyncStorage.setItem(
      PENDING_SESSION_KEY,
      JSON.stringify({ userId, ...snapshot })
    );
  } catch {
    // ignore
  }
}

export async function clearQueuedSessionWrite() {
  try {
    await AsyncStorage.removeItem(PENDING_SESSION_KEY);
  } catch {
    // ignore
  }
}

export async function flushQueuedSessionWrite(currentUserId) {
  let raw;
  try {
    raw = await AsyncStorage.getItem(PENDING_SESSION_KEY);
  } catch {
    return { ok: false, reason: 'read' };
  }
  if (!raw) return { ok: true, skipped: true };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await clearQueuedSessionWrite();
    return { ok: false, reason: 'parse' };
  }

  if (parsed.userId !== currentUserId) {
    return { ok: false, reason: 'user_mismatch' };
  }

  const { userId, ...snap } = parsed;
  const { sessionPayload, activityPayload } = firestorePayloadsFromSnapshot(snap);
  const result = await commitSessionWriteBatch(currentUserId, sessionPayload, activityPayload);
  if (result.ok) await clearQueuedSessionWrite();
  return result;
}
