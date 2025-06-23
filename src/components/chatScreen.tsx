import React from 'react';
import { ChatHeader } from './chatHeader';
import { ChatInput, Chats } from '@/components';

export const ChatScreen = () => {
  return (
    <div className="h-screen flex flex-col">
      <div>
        <ChatHeader />
      </div>
      <div className="flex-1 bg-gray100 overflow-y-auto scrollbar-hide">
        <Chats />
      </div>
      {/* chat input */}
      <div className="p-5">
        {' '}
        <ChatInput />
      </div>
    </div>
  );
};
