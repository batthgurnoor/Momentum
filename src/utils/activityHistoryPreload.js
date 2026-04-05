import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../Firebase/config';

let activeUid = null;
let unsub = null;
let activities = [];
let ready = false;
let refCount = 0;
const listeners = new Set();

function emit() {
  const snap = { activities: [...activities], ready };
  listeners.forEach((cb) => {
    try {
      cb(snap);
    } catch (e) {
      console.log('activityHistoryPreload listener error:', e);
    }
  });
}

function clearSubscription() {
  if (unsub) unsub();
  unsub = null;
  activeUid = null;
  activities = [];
  ready = false;
  emit();
}

function startSubscription(uid) {
  if (!uid) return;
  if (unsub && activeUid === uid) return;
  if (unsub) unsub();
  activeUid = uid;
  activities = [];
  ready = false;
  emit();

  const ref = collection(db, 'users', uid, 'activities');
  const q = query(ref, orderBy('timestamp', 'desc'));
  unsub = onSnapshot(
    q,
    (snapshot) => {
      activities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      ready = true;
      emit();
    },
    (error) => {
      console.log('Activity history preload error:', error);
      ready = true;
      emit();
    }
  );
}

/**
 * Keep Firestore activity history in sync while at least one caller holds a ref.
 * Workout (home) + Activity History screen both attach so opens are warm.
 */
export function attachActivityHistoryPreload(userId) {
  if (!userId) return () => {};
  refCount += 1;
  startSubscription(userId);
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) clearSubscription();
  };
}

export function addActivityHistoryListener(handler) {
  listeners.add(handler);
  handler({ activities: [...activities], ready });
  return () => listeners.delete(handler);
}
