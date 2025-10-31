
'use client';
import { createContext, useContext, useState } from 'react';
import type { Chat } from '@/types';
import GroupInfoSheet from '../chat/group-info-sheet';

type GroupInfoContextType = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  group: Chat | null;
  setGroup: (group: Chat | null) => void;
};

const GroupInfoContext = createContext<GroupInfoContextType | undefined>(
  undefined
);

export function GroupInfoProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [group, setGroup] = useState<Chat | null>(null);

  return (
    <GroupInfoContext.Provider value={{ isOpen, setIsOpen, group, setGroup }}>
      {children}
      <GroupInfoSheet />
    </GroupInfoContext.Provider>
  );
}

export const useGroupInfo = () => {
  const context = useContext(GroupInfoContext);
  if (context === undefined) {
    throw new Error('useGroupInfo must be used within a GroupInfoProvider');
  }
  return context;
};
