import React from 'react';
import { ChatHeader } from './chatHeader';
import { ChatInput, Chats } from '@/components';

export const ChatScreen = () => {
  return (
    <div className="h-screen flex flex-col">
      <div>
        <ChatHeader />
      </div>
      <div className="bg-gray100 flex-1 overflow-y-auto scrollbar-hide">
        <Chats />
      </div>
      {/* chat input */}
      <div className="p-5">
        <ChatInput />
      </div>
    </div>
  );
};
