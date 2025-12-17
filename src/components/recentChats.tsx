'use client';
import { useAuthStore } from '@/store/authStore';
import React, { useMemo } from 'react';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { useMessageStore } from '@/store/messageStore';
import { Message } from '@/types';

export const RecentChats = () => {
  const { otherUserData } = useAuthStore(state => state);
  const { setSelectedChatUser, lastMessages } = useMessageStore(state => state);

  // Get the last 5 recent chats from lastMessages
  const recentChats = useMemo(() => {
    if (!lastMessages || lastMessages.length === 0) {
      return [];
    }

    // Get the first 5 most recent chats (they're already sorted by most recent)
    const recentLastMessages = lastMessages.slice(0, 5);

    // Map to user data
    return recentLastMessages
      .map(lastMessageData => {
        const user = otherUserData.find(
          u => u.id === lastMessageData.otherUserId
        );
        if (!user) return null;
        return {
          ...user,
          lastMessage: lastMessageData.lastMessage,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string;
      lastMessage: Message | null;
    }>;
  }, [lastMessages, otherUserData]);

  if (!recentChats || recentChats.length === 0) {
    return <p className="text-sm text-gray">No recent chats.</p>;
  }

  return (
    <div className="flex justify-around">
      {recentChats.map(({ id, full_name, avatar_url, email }) => {
        const fullName = full_name || '';
        const [firstName] = fullName.split(' ');

        return (
          <div
            key={id}
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() =>
              setSelectedChatUser({ id, full_name, avatar_url, email })
            }
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
