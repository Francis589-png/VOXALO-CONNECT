
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { WifiOff } from 'lucide-react';

type ConnectivityContextType = {
  isOnline: boolean;
};

const ConnectivityContext = createContext<ConnectivityContextType>({ isOnline: true });

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const connectedRef = ref(rtdb, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      const connected = snap.val() === true;
      setIsOnline(connected);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline }}>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground text-sm text-center p-2 z-[200] flex items-center justify-center gap-2">
          <WifiOff className='h-4 w-4'/>
          You are currently offline. Some features may be unavailable.
        </div>
      )}
      {children}
    </ConnectivityContext.Provider>
  );
}

export const useConnectivity = () => {
  const context = useContext(ConnectivityContext);
  if (context === undefined) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return context;
};
