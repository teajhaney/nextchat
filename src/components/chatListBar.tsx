'use client';
import { useAuthStore } from '@/app/store/authStore';
import React from 'react';

export const ChatListBar = () => {
  const { otherUserData } = useAuthStore(state => state);

  if (!otherUserData || otherUserData.length === 0) {
    return <p>No other users found.</p>;
  }
  return (
    <div className=" gap-2 center-col">
      {otherUserData?.map(item => (
        <div key={item.id}>{item.full_name}</div>
      ))}
    </div>
  );
};
