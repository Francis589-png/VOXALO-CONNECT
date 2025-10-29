
'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';
import { auth, db, rtdb } from '@/lib/firebase';
import Loading from '@/app/loading';
import { requestNotificationPermission } from '@/lib/fcm';
import { ref, onValue, set, onDisconnect, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';


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
        requestNotificationPermission(user.uid);
        
        const userDocRef = doc(db, 'users', user.uid);
        const userStatusDatabaseRef = ref(rtdb, '/status/' + user.uid);

        // We'll create two constants which we will write to 
        // the Realtime database when this device is offline
        // or online.
        const isOfflineForDatabase = {
            state: 'offline',
            last_changed: rtdbServerTimestamp(),
        };

        const isOnlineForDatabase = {
            state: 'online',
            last_changed: rtdbServerTimestamp(),
        };

        const connectedRef = ref(rtdb, '.info/connected');
        onValue(connectedRef, (snap) => {
            if (snap.val() == false) {
                // Instead of simply returning, we'll also set Firestore's state
                // to 'offline'. This ensures that our Firestore cache is aware
                // of the switch to 'offline.'
                updateDoc(userDocRef, {
                    lastSeen: serverTimestamp(),
                });
                return;
            };

            onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
                set(userStatusDatabaseRef, isOnlineForDatabase);

                // We'll also add a marker to our Firestore user document
                // when the user goes offline.
                updateDoc(userDocRef, {
                    lastSeen: serverTimestamp(),
                });
            });
        });
        
        // Set up presence management on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                set(userStatusDatabaseRef, isOnlineForDatabase);
                updateDoc(userDocRef, {
                    lastSeen: serverTimestamp(),
                });
            } else {
                 updateDoc(userDocRef, {
                    lastSeen: serverTimestamp(),
                });
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
