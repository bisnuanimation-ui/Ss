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
  onSnapshot
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
  incrementGenerationCount: () => Promise<boolean>; // Returns true if allowed, false if limit exceeded
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

const LOCAL_STORAGE_HISTORY_KEY = 'promptvision_history_v1';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<SavedAnalysis[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Listen for auth state and user profile updates in real-time!
  useEffect(() => {
    setLoading(true);
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        const defaultProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Creator',
          photoURL: firebaseUser.photoURL || '',
          role: firebaseUser.email === 'bisnuanimation@gmail.com' ? 'admin' : 'user',
          subscription: {
            status: 'free',
            expiresAt: 0,
            token: ''
          },
          dailyGenerations: 0,
          lastGenerationDate: new Date().toISOString().split('T')[0]
        };

        // Create document if it doesn't exist yet
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              ...defaultProfile,
              createdAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (err) {
          console.warn("Error creating user profile:", err);
        }

        // Establish real-time listener on the user's document
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Creator',
              photoURL: firebaseUser.photoURL || '',
              role: data.role || (firebaseUser.email === 'bisnuanimation@gmail.com' ? 'admin' : 'user'),
              subscription: data.subscription || { status: 'free', expiresAt: 0, token: '' },
              dailyGenerations: data.dailyGenerations ?? 0,
              lastGenerationDate: data.lastGenerationDate ?? ''
            });
          } else {
            setUser(defaultProfile);
          }
          setLoading(false);
        }, (error) => {
          console.warn("User onSnapshot listener error:", error);
          setUser(defaultProfile);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
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

  const incrementGenerationCount = async (): Promise<boolean> => {
    if (!user) return true; // Let non-logged in or guest user rely on local key if needed, or enforce login

    // Admin has unlimited trials
    if (user.role === 'admin') return true;

    // Premium users have unlimited trials
    if (user.subscription?.status === 'premium') return true;

    const todayStr = new Date().toISOString().split('T')[0];
    let dailyCount = user.dailyGenerations || 0;
    const lastDate = user.lastGenerationDate || '';

    if (lastDate !== todayStr) {
      dailyCount = 0;
    }

    // Five-generation trial limit
    if (dailyCount >= 5) {
      return false;
    }

    // Save incremented count
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        dailyGenerations: dailyCount + 1,
        lastGenerationDate: todayStr
      }, { merge: true });
    } catch (err) {
      console.warn("Could not save generation increment on cloud:", err);
    }

    return true;
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
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      history, 
      signIn, 
      logout, 
      saveAnalysis, 
      clearHistory,
      incrementGenerationCount
    }}>
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
