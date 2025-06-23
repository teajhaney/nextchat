'use client';
import { useAuthStore } from '@/app/store/authStore';
import React from 'react';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { useMessageStore } from '@/app/store/messageStore';
export const RecentChats = () => {
  const { otherUserData } = useAuthStore(state => state);
  const { setSelectedChatUser } = useMessageStore(state => state);

  if (!otherUserData || otherUserData.length === 0) {
    return <p>No other users found.</p>;
  }
  return (
    <div className="flex justify-around">
      {otherUserData.slice(0, 4).map(({ id, full_name, avatar_url, email }) => {
        const fullName = full_name || '';
        const [firstName] = fullName.split(' ');

        return (
          <div
            key={id}
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => setSelectedChatUser({ id, full_name, avatar_url, email })}
          >
            <Image
              src={avatar_url || avatarUrl}
              alt={full_name}
              width={40}
              height={40}
              className="size-10 rounded-full"
            />
            <div className="">
              <h1 className="text-sm text-gray">{firstName}</h1>
            </div>
          </div>
        );
      })}
    </div>
  );
};
