'use client';
import { useAuthStore } from '@/app/store/authStore';
import React from 'react';
import { LoadingSpinner } from '@/components';

export const ChatListBar = () => {
  const { otherUserData, loading } = useAuthStore(state => state);

  if (loading)
    return (
      <div>
        <LoadingSpinner className="border-primary h-6 w-6 border-dashed border-2" />
      </div>
    );

  if (!otherUserData || otherUserData.length === 0) {
    return <p>No other users found.</p>;
  }
  return (
    <aside className="px-2 pt-2">
     
    </aside>
  );
};
