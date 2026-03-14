import React, { createContext, useContext, useEffect, useState } from 'react';
import { authInstance, db } from '@/config/firebase';
import { User } from '@/types';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthContextType {
  firebaseUser: FirebaseAuthTypes.User | null;
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  loading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authInstance.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const doc = await db.collection('users').doc(fbUser.uid).get();
        if (doc.exists()) {
          setUser({ uid: doc.id, ...doc.data() } as User);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
