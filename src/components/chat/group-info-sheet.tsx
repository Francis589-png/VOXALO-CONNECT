
'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useGroupInfo } from '../providers/group-info-provider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Pencil,
  Upload,
  UserPlus,
  UserX,
  LogOut,
  Check,
  X,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';
import { useFriends } from '../providers/friends-provider';
import { Checkbox } from '../ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  leaveGroup,
  removeUserFromGroup,
  updateGroupDetails,
  addUsersToGroup,
} from '@/lib/actions/group-actions';
import { useToast } from '@/hooks/use-toast';

function AddMembersDialog({
  groupMembers,
  onAddMembers,
}: {
  groupMembers: User[];
  onAddMembers: (users: User[]) => void;
}) {
  const { friendships } = useFriends();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const friendsNotInGroup = friendships.filter(
    (f) => !groupMembers.some((gm) => gm.uid === f.friend.uid)
  ).map(f => f.friend);

  const handleSelect = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user]
    );
  };
  
  const handleAdd = () => {
    onAddMembers(selectedUsers);
    setSelectedUsers([]);
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserPlus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Select friends to add
          </h3>
          <ScrollArea className="h-64 mt-2">
            <div className="flex flex-col gap-1">
              {friendsNotInGroup.length > 0 ? friendsNotInGroup.map((friend) => (
                <div
                  key={friend.uid}
                  className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleSelect(friend)}
                >
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage
                      src={friend.photoURL || undefined}
                      alt={friend.displayName!}
                    />
                    <AvatarFallback>{friend.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">
                    {friend.displayName}
                  </span>
                  <Checkbox
                    checked={selectedUsers.some((u) => u.uid === friend.uid)}
                    onCheckedChange={() => handleSelect(friend)}
                  />
                </div>
              )) : (
                <p className='text-sm text-muted-foreground text-center p-4'>No other friends to add.</p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={selectedUsers.length === 0}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupInfoSheet() {
  const { user: currentUser } = useAuth();
  const { isOpen, setIsOpen, group, setGroup } = useGroupInfo();
  const { toast } = useToast();

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupPhoto, setGroupPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>('');

  const photoInputRef = useRef<HTMLInputElement>(null);

  const isCreator = currentUser?.uid === group?.createdBy;

  useEffect(() => {
    if (group) {
        setGroupName(group.name || '');
        setPhotoPreview(group.photoURL || null);
    }
  }, [group]);


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

  const handleSaveDetails = async () => {
    if (!group) return;
    try {
        await updateGroupDetails(group.id, groupName, groupPhoto);
        toast({ title: 'Success', description: 'Group updated successfully.' });
        setIsEditingName(false);
        setGroupPhoto(null);
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to update group.', variant: 'destructive' });
    }
  };
  
  const handleRemoveUser = async (userId: string) => {
    if (!group) return;
    try {
        await removeUserFromGroup(group.id, userId);
        toast({ title: 'Success', description: 'User removed from group.' });
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to remove user.', variant: 'destructive' });
    }
  }

  const handleLeaveGroup = async () => {
    if (!group || !currentUser) return;
     try {
        await leaveGroup(group.id, currentUser.uid);
        toast({ title: 'Success', description: 'You have left the group.' });
        setIsOpen(false);
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to leave group.', variant: 'destructive' });
    }
  }

  const handleAddMembers = async (usersToAdd: User[]) => {
    if (!group) return;
    try {
        await addUsersToGroup(group.id, usersToAdd);
        toast({ title: 'Success', description: 'Members added successfully.' });
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to add members.', variant: 'destructive' });
    }
  }

  if (!group) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col bg-background/95 backdrop-blur-lg">
        <SheetHeader>
          <SheetTitle>Group Info</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center pt-4">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-muted">
              <AvatarImage
                src={photoPreview || undefined}
                alt={group.name}
              />
              <AvatarFallback>{group.name?.[0]}</AvatarFallback>
            </Avatar>
            {isCreator && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-8 w-8 bg-background/80 group-hover:bg-background"
                onClick={() => photoInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={photoInputRef}
              onChange={handlePhotoChange}
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            {isEditingName ? (
              <>
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="text-lg font-semibold h-9"
                />
                <Button size="icon" className='h-9 w-9' variant="ghost" onClick={handleSaveDetails}><Check className='h-5 w-5'/></Button>
                <Button size="icon" className='h-9 w-9' variant="ghost" onClick={() => { setIsEditingName(false); setGroupName(group.name || '')}}><X className='h-5 w-5' /></Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{group.name}</h2>
                {isCreator && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {group.users.length} members
          </p>

          {(groupName !== group.name || groupPhoto) && isCreator && (
              <Button className='mt-4' onClick={handleSaveDetails}>Save Changes</Button>
          )}
        </div>
        <div className="mt-6 flex-1 flex flex-col">
          <h3 className="text-sm font-semibold px-4">Members</h3>
          <ScrollArea className="flex-1 mt-2">
            <div className="flex flex-col gap-1 px-4">
              {group.userInfos.map((member) => (
                <div key={member.uid} className="flex items-center p-2 rounded-md group">
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage
                      src={member.photoURL || undefined}
                      alt={member.displayName!}
                    />
                    <AvatarFallback>{member.displayName?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">{member.displayName}</span>
                  {member.uid === group.createdBy && <div className='text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md'>Creator</div>}
                  {isCreator && member.uid !== currentUser?.uid && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <UserX className="h-4 w-4 text-red-500" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently remove {member.displayName} from the group.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveUser(member.uid)} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="p-4 flex flex-col gap-2 border-t">
          {isCreator && <AddMembersDialog groupMembers={group.userInfos} onAddMembers={handleAddMembers} />}
          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                    <LogOut className="mr-2 h-4 w-4" /> Leave Group
                </Button>
            </AlertDialogTrigger>
             <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                <AlertDialogDescription>
                   You will no longer be able to see messages or participate in this group. Are you sure?
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveGroup} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Leave</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
