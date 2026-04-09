import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Put your own firebase config here
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const storage = getStorage(app);
export { auth };

/**
 * Web: IndexedDB-backed persistence. iOS/Android: memory only — RN has no usable IndexedDB;
 * session/activity reliability uses AsyncStorage retry queue in sessionFirestoreWrite.js.
 */
const firestoreLocalCache =
  Platform.OS === "web" ? persistentLocalCache() : memoryLocalCache();

let db;
try {
  db = initializeFirestore(app, { localCache: firestoreLocalCache });
} catch {
  db = getFirestore(app);
}
export { db };
