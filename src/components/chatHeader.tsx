import React from 'react';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { ChatOptions } from '@/components';
import { useMessageStore } from '@/app/store/messageStore';

export const ChatHeader = () => {
  const { selectedChatUser } = useMessageStore(state => state);
  return (
    <div className="p-3 flex justify-between items-center shadow rounded-sm cursor-pointer">
      <div className="flex items-center gap-2">
        <Image
          src={selectedChatUser?.avatar_url || avatarUrl}
          alt={selectedChatUser?.full_name || 'user avatar'}
          width={40}
          height={40}
          className="size-15 rounded-full"
        />
        <div className="flex flex-col justify-between">
          <h1 className="font-bold">{selectedChatUser?.full_name}</h1>
          <h1 className="text-xs text-gray">online</h1>
        </div>
      </div>
      <div>
        <ChatOptions />
      </div>
    </div>
  );
};
