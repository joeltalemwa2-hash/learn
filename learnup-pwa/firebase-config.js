// ============================================================================
// FIREBASE CONFIG — paste your own project's keys here.
//
// 1. Go to https://console.firebase.google.com → Create project (free)
// 2. Inside the project: Build → Firestore Database → Create database
//    (start in "production mode", pick a region close to Uganda e.g. europe-west1)
// 3. Set Firestore rules — see README.md for the exact rules to paste in
//    Firestore → Rules tab.
// 4. Project settings (gear icon) → General → "Your apps" → Add app → Web (</>)
// 5. Copy the firebaseConfig object Firebase gives you and paste it below,
//    replacing the placeholder values.
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);