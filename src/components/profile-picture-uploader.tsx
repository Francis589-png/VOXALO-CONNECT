'use client';

import { Camera, Upload, User as UserIcon } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface ProfilePictureUploaderProps {
  onPictureChange: (file: File | null) => void;
  initialImageUrl?: string | null;
}

export default function ProfilePictureUploader({
  onPictureChange,
  initialImageUrl,
}: ProfilePictureUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialImageUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onPictureChange(file);
    } else {
      onPictureChange(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-muted">
          <AvatarImage src={previewUrl || undefined} alt="Profile Picture" />
          <AvatarFallback className="bg-muted">
            <UserIcon className="h-16 w-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="absolute bottom-1 right-1 rounded-full"
          onClick={handleUploadClick}
        >
          <Camera className="h-5 w-5" />
          <span className="sr-only">Upload profile picture</span>
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/gif"
      />
      <p className="text-sm text-muted-foreground">
        Click the camera to upload a picture.
      </p>
    </div>
  );
}
