'use client';
import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

import { useFriends } from '@/components/providers/friends-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Chat, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
import { createGroupChat } from '@/lib/actions/create-group-chat';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { UserPlus } from 'lucide-react';
import { Label } from '../ui/label';

interface CreateGroupDialogProps {
  children: React.ReactNode;
  currentUser: FirebaseUser;
  onGroupCreated: (chat: Chat) => void;
}

export default function CreateGroupDialog({ children, currentUser, onGroupCreated }: CreateGroupDialogProps) {
  const { friendships } = useFriends();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const friends = friendships.map((f) => f.friend);

  const handleUserSelect = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (groupName.trim() === '' || selectedUsers.length === 0) {
      toast({
        title: 'Error',
        description: 'Group name and at least one member are required.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', groupName);
    const allUsers = [...selectedUsers, currentUser as User];
    formData.append('userIds', JSON.stringify(allUsers.map(u => u.uid)));
    formData.append('userInfos', JSON.stringify(allUsers.map(u => ({
        uid: u.uid,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
    }))));

    if (groupPhoto) {
      formData.append('photo', groupPhoto);
    }

    try {
      const newGroup = await createGroupChat(formData);
      onGroupCreated(newGroup);
      setIsOpen(false);
      resetState();
    } catch (error) {
      toast({
        title: 'Error creating group',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const resetState = () => {
    setGroupName('');
    setSelectedUsers([]);
    setGroupPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
             <Label htmlFor="group-photo-upload" className='cursor-pointer'>
                <Avatar className="h-16 w-16">
                    {photoPreview ? (
                        <AvatarImage src={photoPreview} />
                    ): (
                        <AvatarFallback><UserPlus className="h-8 w-8" /></AvatarFallback>
                    )}
                </Avatar>
             </Label>
             <Input id="group-photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className='hidden' />
             <Input
                id="name"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
            />
          </div>
          
          <h3 className="text-sm font-medium text-muted-foreground">Select members</h3>
          <ScrollArea className="h-64">
            <div className="flex flex-col gap-1">
                {friends.map((friend) => (
                <div
                    key={friend.uid}
                    className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => handleUserSelect(friend)}
                >
                    <Avatar className="h-9 w-9 mr-3">
                        <AvatarImage src={friend.photoURL!} alt={friend.displayName!} />
                        <AvatarFallback>{friend.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium">{friend.displayName}</span>
                    <Checkbox
                    checked={selectedUsers.some((u) => u.uid === friend.uid)}
                    onCheckedChange={() => handleUserSelect(friend)}
                    />
                </div>
                ))}
            </div>
          </ScrollArea>

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleCreateGroup}>Create Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
