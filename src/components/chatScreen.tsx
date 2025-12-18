import React from 'react';
import { ChatHeader } from './chatHeader';
import { ChatInput, Chats } from '@/components';

export const ChatScreen = () => {
  return (
    <div className="h-screen max-lg:h-[100svh] flex flex-col">
      {/* Fixed header */}
      <div className="flex-shrink-0 bg-background">
        <ChatHeader />
      </div>
      {/* Scrollable messages area */}
      <div className="bg-gray100 flex-1 min-h-0 overflow-y-auto">
        <Chats />
      </div>
      {/* Fixed input at bottom - flexbox keeps it visible above keyboard */}
      <div className="flex-shrink-0 p-3 max-lg:p-4 bg-background border-t border-primary/20">
        <ChatInput />
      </div>
    </div>
  );
};
