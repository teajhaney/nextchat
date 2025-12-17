'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { searchUserByEmail } from '@/lib/services/userService';
import { useAuthStore } from '@/store/authStore';
import { useMessageStore } from '@/store/messageStore';
import { toast } from 'sonner';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddUserDialog = ({ open, onOpenChange }: AddUserDialogProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, otherUserData, setOtherUserData } = useAuthStore(
    state => state
  );
  const { setSelectedChatUser } = useMessageStore(state => state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to add users');
      return;
    }

    setIsLoading(true);

    try {
      // Search for user by email
      const foundUser = await searchUserByEmail(email.trim());

      if (!foundUser) {
        toast.error('User not found. Please check the email address.');
        setIsLoading(false);
        return;
      }

      // Check if user is trying to add themselves
      if (foundUser.id === user.id) {
        toast.error('You cannot add yourself');
        setIsLoading(false);
        return;
      }

      // Check if user already exists in otherUserData
      const userExists = otherUserData.some(u => u.id === foundUser.id);

      if (!userExists) {
        // Add user to otherUserData
        setOtherUserData([...otherUserData, foundUser]);
      }

      // Close dialog and reset form
      setEmail('');
      onOpenChange(false);

      // Open chat with the user
      setSelectedChatUser({
        id: foundUser.id,
        full_name: foundUser.full_name,
        avatar_url: foundUser.avatar_url,
        email: foundUser.email,
      });

      toast.success(`Chat with ${foundUser.full_name} opened`);
    } catch (error) {
      console.error('Error adding user:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to add user. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              autoFocus
              className="border-primary focus-visible:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-primary"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
