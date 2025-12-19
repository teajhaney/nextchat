'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { UserData } from '@/types';
import { updateUserProfile } from '@/lib/services/userService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Edit2, Save, X } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData;
  isCurrentUser?: boolean;
}

export const ProfileModal = ({
  open,
  onOpenChange,
  user,
  isCurrentUser = false,
}: ProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser, setUserData } = useAuthStore(state => state);

  useEffect(() => {
    setFullName(user.full_name);
    setIsEditing(false);
  }, [user, open]);

  const handleSave = async () => {
    if (!isCurrentUser || !currentUser) {
      toast.error('You can only edit your own profile');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      const updatedProfile = await updateUserProfile(currentUser.id, {
        full_name: fullName.trim(),
      });

      if (updatedProfile) {
        setUserData(updatedProfile);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(user.full_name);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>
            {isCurrentUser ? 'Your Profile' : 'Profile'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Image
                src={user.avatar_url || avatarUrl}
                alt={user.full_name || 'User avatar'}
                width={120}
                height={120}
                className="w-28 h-28 rounded-full object-cover"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            {isEditing && isCurrentUser ? (
              <div className="flex gap-2">
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="flex-1 border-1 border-primary"
                  autoFocus
                />
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !fullName.trim()}
                  size="icon"
                  variant="outline"
                  className="border-1 border-primary"
                >
                  <Save className="size-4" />
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  size="icon"
                  variant="outline"
                  className="border-1 border-primary"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 border-1 border-primary rounded-md">
                <p className="text-base">{user.full_name}</p>
                {isCurrentUser && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 hover:bg-primary/10 rounded"
                    aria-label="Edit name"
                  >
                    <Edit2 className="size-4 text-primary" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="p-2  rounded-md border-1 border-primary">
              <p className="text-base text-gray">{user.email}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
