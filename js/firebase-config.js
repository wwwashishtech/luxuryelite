// Firebase Configuration - Backend Core
// Replace with your Firebase config from console

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc, 
    doc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy, 
    limit,
    Timestamp,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject,
    listAll
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Your Firebase Configuration (REPLACE WITH YOUR ACTUAL CONFIG)
const firebaseConfig = {
    apiKey: "AIzaSyASxBb3NOIqhaYv8ROGYJ6SdqrlT_cXBo",
    authDomain: "realestate-lead.firebaseapp.com",
    projectId: "realestate-lead",
    storageBucket: "realestate-lead.firebasestorage.app",
    messagingSenderId: "416851177138",
    appId: "1:416851177130:web:d3737cff3496224b5d2ad3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Collection References
const propertiesCollection = collection(db, "properties");
const inquiriesCollection = collection(db, "inquiries");
const leadsCollection = collection(db, "leads");
const contactsCollection = collection(db, "contacts");
const subscribersCollection = collection(db, "subscribers");
const usersCollection = collection(db, "users");

// Export all Firebase services
export {
    db,
    storage,
    auth,
    propertiesCollection,
    inquiriesCollection,
    leadsCollection,
    contactsCollection,
    subscribersCollection,
    usersCollection,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    serverTimestamp,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    listAll,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail
};