// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getStrorage} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAS-FdzdCCZl2rlWmUIa5XI9Cby1ztfs3k",
  authDomain: "momentum-9211.firebaseapp.com",
  projectId: "momentum-9211",
  storageBucket: "momentum-9211.firebasestorage.app",
  messagingSenderId: "597721173761",
  appId: "1:597721173761:web:7fa51f9922e9dc66e85500"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStrorage(app);