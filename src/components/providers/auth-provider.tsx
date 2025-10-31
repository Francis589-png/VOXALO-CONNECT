
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';
import { auth, db, rtdb } from '@/lib/firebase';
import Loading from '@/app/loading';
import { onValue, ref, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';


type AuthContextType = {
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_ROUTES = ['/login', '/signup'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userStatusRef = ref(rtdb, `status/${user.uid}`);
        
        const isOfflineForFirestore = {
            status: 'offline',
            lastSeen: serverTimestamp(),
        };
        const isOnlineForFirestore = {
            status: 'online',
            lastSeen: serverTimestamp(),
        };

        const isOfflineForRTDB = {
            status: 'offline',
            lastSeen: rtdbServerTimestamp(),
        };
        const isOnlineForRTDB = {
            status: 'online',
            lastSeen: rtdbServerTimestamp(),
        };

        onValue(ref(rtdb, '.info/connected'), (snapshot) => {
            if (snapshot.val() === true) {
                onDisconnect(userStatusRef).set(isOfflineForRTDB).then(() => {
                    set(userStatusRef, isOnlineForRTDB);
                    updateDoc(userDocRef, isOnlineForFirestore);
                });
            }
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                set(userStatusRef, isOnlineForRTDB);
                updateDoc(userDocRef, isOnlineForFirestore);
            } else {
                set(userStatusRef, isOfflineForRTDB);
                updateDoc(userDocRef, isOfflineForFirestore);
            }
        });

      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    if (!user && !isAuthRoute) {
      router.push('/login');
    } else if (user && isAuthRoute) {
      router.push('/');
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <Loading />;
  }
  
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  if (!user && !isAuthRoute) {
    return <Loading />;
  }

  if (user && isAuthRoute) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
