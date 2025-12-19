'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { updateUserProfile, uploadAvatar } from '@/lib/services/userService';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Edit2, Save, X, Camera } from 'lucide-react';

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user: currentUser, setUserData } = useAuthStore(state => state);

  useEffect(() => {
    setFullName(user.full_name);
    setIsEditing(false);
    setAvatarPreview(null);
  }, [user, open]);

  const handleAvatarClick = () => {
    if (isCurrentUser && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !isCurrentUser) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setIsUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(currentUser.id, file);
      const updatedProfile = await updateUserProfile(currentUser.id, {
        avatar_url: avatarUrl,
      });

      if (updatedProfile) {
        setUserData(updatedProfile);

        // Update localStorage cache to reflect the new avatar
        const LOCAL_STORAGE_KEY = 'nextchat_auth';
        const cachedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cachedAuth) {
          try {
            const authData = JSON.parse(cachedAuth);
            authData.userData = updatedProfile;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authData));
          } catch (error) {
            console.error('Failed to update localStorage cache:', error);
          }
        }

        toast.success('Avatar updated successfully');
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to upload avatar. Please try again.';
      toast.error(errorMessage);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
              <div
                className={`relative ${
                  isCurrentUser ? 'cursor-pointer' : ''
                } group`}
                onClick={handleAvatarClick}
              >
                <Image
                  src={avatarPreview || user.avatar_url || avatarUrl}
                  alt={user.full_name || 'User avatar'}
                  width={120}
                  height={120}
                  className="w-28 h-28 rounded-full object-cover"
                />
                {isCurrentUser && (
                  <>
                    {/* Edit overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isUploadingAvatar ? (
                        <div className="text-white text-xs">Uploading...</div>
                      ) : (
                        <Camera className="size-6 text-white" />
                      )}
                    </div>
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              {/* Edit button for avatar */}
              {isCurrentUser && (
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Change avatar"
                >
                  <Camera className="size-4" />
                </button>
              )}
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
