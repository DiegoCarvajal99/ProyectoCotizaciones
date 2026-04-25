import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  accessExpiration: Timestamp;
  status: 'active' | 'inactive';
}

type AuthListener = (user: User | null, profile: UserProfile | null, loading: boolean) => void;
const listeners = new Set<AuthListener>();

let currentUser: User | null = auth.currentUser;
let currentProfile: UserProfile | null = null;
let isLoading = !currentUser; // If we don't have a user, we must wait for onAuthStateChanged
let hasInitialized = false;

// Initialize observer
console.log("[AuthStore] Initializing observer...");

// Fail-safe: if after 5 seconds we are still loading, force it to false
const failSafe = setTimeout(() => {
  if (isLoading) {
    console.warn("[AuthStore] Fail-safe triggered: forcing loading to false");
    isLoading = false;
    listeners.forEach(l => l(currentUser, currentProfile, isLoading));
  }
}, 5000);

onAuthStateChanged(auth, async (firebaseUser) => {
  console.log("[AuthStore] Auth state changed:", firebaseUser?.email || "No user");
  clearTimeout(failSafe);
  
  // Only show loading if the user changed or we haven't initialized yet
  if (firebaseUser?.uid !== currentUser?.uid || !hasInitialized) {
    isLoading = true;
    if (firebaseUser?.uid !== currentUser?.uid) {
      currentProfile = null;
    }
    listeners.forEach(l => l(currentUser, currentProfile, isLoading));
  }

  currentUser = firebaseUser;

  if (firebaseUser) {
    const isSuperUser = firebaseUser.email === 'diegoandres2015k@gmail.com';
    
    // IMMEDIATE INITIALIZATION for Super User or basic identity
    currentProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      empresa: isSuperUser ? "MT_SYS Administrativo" : "Cargando...",
      role: isSuperUser ? 'admin' : 'user',
      accessExpiration: Timestamp.fromMillis(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
      status: 'active',
    };

    // Notify listeners that we have a basic profile already
    listeners.forEach(l => l(currentUser, currentProfile, isLoading));

    try {
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const dbData = docSnap.data() as UserProfile;
        currentProfile = { ...dbData, uid: firebaseUser.uid };
        if (isSuperUser) {
          currentProfile.role = 'admin';
          currentProfile.empresa = "MT_SYS Administrativo";
        }
        console.log("[AuthStore] Profile loaded and merged.");
      } else {
        console.log("[AuthStore] No profile found in DB, keeping current identity.");
        // Only create if it's a new non-superuser who needs a trial?
        // For now, let's just save the currentProfile if it doesn't exist
        await setDoc(docRef, currentProfile);
      }
    } catch (error) {
      console.error("[AuthStore] Error loading profile from DB:", error);
      // We already have the currentProfile set above, so it's fine.
    }
  }

  isLoading = false;
  hasInitialized = true;
  console.log("[AuthStore] Loading complete.");
  listeners.forEach(l => l(currentUser, currentProfile, isLoading));
});

export const authStore = {
  subscribe(l: AuthListener) {
    listeners.add(l);
    l(currentUser, currentProfile, isLoading);
    return () => listeners.delete(l);
  },
  get() {
    return { user: currentUser, profile: currentProfile, loading: isLoading };
  }
};
