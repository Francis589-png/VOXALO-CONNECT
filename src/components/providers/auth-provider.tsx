
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import Loading from '@/app/loading';
import { onValue, ref, onDisconnect, set, serverTimestamp as rtdbServerTimestamp, getDatabase } from 'firebase/database';
import { formatDistanceToNow } from 'date-fns';


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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.isBanned) {
            await signOut(auth);
            setUser(null);
            router.push('/login');
            setLoading(false);
            return;
          }
          if (userData.suspendedUntil && userData.suspendedUntil.toDate() > new Date()) {
            await signOut(auth);
            setUser(null);
            const timeLeft = formatDistanceToNow(userData.suspendedUntil.toDate());
            router.push(`/login?suspended=${encodeURIComponent(timeLeft)}`);
            setLoading(false);
            return;
          }
        }

        setUser(user);
        
        const rtdb = getDatabase();
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

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
