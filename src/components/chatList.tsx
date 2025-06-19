'use client'
import { useAuthStore } from '@/app/store/authStore';
import React from 'react';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
export const ChatList = () => {
  const { otherUserData } = useAuthStore(state => state);

  if (!otherUserData || otherUserData.length === 0) {
    return <p>No other users found.</p>;
  }

  return (
    <div className="space-y-3">
      {otherUserData.map(({ id, full_name, avatar_url }) => (
        <div
          key={id}
          className="p-3 flex justify-between items-center shadow rounded-sm cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Image
              src={avatar_url || avatarUrl}
              alt={full_name}
              width={40}
              height={40}
              className="size-15 rounded-full"
            />
            <div className="flex flex-col justify-between">
              <h1 className="font-bold">{full_name}</h1>
              <h1 className="text-xs">typing</h1>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <h1>time</h1>
            <h1>icons</h1>
          </div>
        </div>
      ))}
    </div>
  );
};
