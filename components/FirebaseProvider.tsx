import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User as FirebaseUser,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  collection,
  addDoc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile, AnalysisResult, SavedAnalysis } from '../types';

interface FirebaseContextType {
  user: UserProfile | null;
  loading: boolean;
  history: SavedAnalysis[];
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  saveAnalysis: (result: AnalysisResult, imageThumbnail?: string) => Promise<void>;
  clearHistory: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const LOCAL_STORAGE_HISTORY_KEY = 'promptvision_history_v1';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Creator',
          photoURL: firebaseUser.photoURL || '',
          role: 'user',
        };

        setUser(userProfile);

        // Attempt silent sync to Firestore without blocking the app if rules are restrictive
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              ...userProfile,
              createdAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (err) {
          // Gracefully swallow permissions or network warnings during silent sync
          console.warn("User profile background sync note:", err);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.warn("Sign-in cancelled or closed:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const saveAnalysis = async (result: AnalysisResult, imageThumbnail?: string) => {
    const newEntry: SavedAnalysis = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      imageThumbnail: imageThumbnail || '',
      result,
    };

    // 1. Always save in local storage for instant availability
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 20); // Keep last 20
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn("LocalStorage save warning:", err);
      }
      return updated;
    });

    // 2. If authenticated, optionally also save to Firestore
    if (user?.uid) {
      try {
        await addDoc(collection(db, `users/${user.uid}/analyses`), {
          ...result,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Could not save to remote cloud:", err);
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    } catch (err) {
      console.warn("Clear history error:", err);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, loading, history, signIn, logout, saveAnalysis, clearHistory }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export default FirebaseProvider;
