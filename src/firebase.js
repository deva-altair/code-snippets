// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCsTkjWEiPi6OvkqgPn5Bm0Z_8TOSFBtnM",
    authDomain: "code-snippets-69637.firebaseapp.com",
    projectId: "code-snippets-69637",
    storageBucket: "code-snippets-69637.firebasestorage.app",
    messagingSenderId: "777375833541",
    appId: "1:777375833541:web:33056b7f3660def2c93fac"
  };

  const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);
  export const auth = getAuth(app);
  export const googleProvider = new GoogleAuthProvider();
  export const githubProvider = new GithubAuthProvider();
  
  // Add scopes for GitHub repos access (optional)
  githubProvider.addScope('repo:status');
  githubProvider.addScope('repo');
  githubProvider.addScope('gist');