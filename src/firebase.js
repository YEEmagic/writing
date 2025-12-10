import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAXIgg9A3-_wXxPWCmszoUlnzMSAajcFQc",
  authDomain: "writing-c12e4.firebaseapp.com",
  projectId: "writing-c12e4",
  storageBucket: "writing-c12e4.firebasestorage.app",
  messagingSenderId: "401581263036",
  appId: "1:401581263036:web:f21fc897f1dba7bb1428b9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
