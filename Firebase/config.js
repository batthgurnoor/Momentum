
import { initializeApp } from "firebase/app";
import {getStorage} from "firebase/storage";
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAS-FdzdCCZl2rlWmUIa5XI9Cby1ztfs3k",
  authDomain: "momentum-9211.firebaseapp.com",
  projectId: "momentum-9211",
  storageBucket: "momentum-9211.firebasestorage.app",
  messagingSenderId: "597721173761",
  appId: "1:597721173761:web:7fa51f9922e9dc66e85500"
};


const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const auth = getAuth(app);