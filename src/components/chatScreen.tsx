import React from 'react';
import { ChatHeader } from './chatHeader';
import { ChatInput, Chats } from '@/components';

export const ChatScreen = () => {
  return (
    <div className="h-screen max-lg:h-[100dvh] flex flex-col overflow-hidden">
      {/* Fixed header */}
      <div className="flex-shrink-0 z-10 bg-background sticky top-0">
        <ChatHeader />
      </div>
      {/* Scrollable messages area */}
      <div className="bg-gray100 flex-1 min-h-0 overflow-hidden">
        <Chats />
      </div>
      {/* Fixed input at bottom */}
      <div className="flex-shrink-0 p-3 max-lg:p-4 bg-background border-t border-primary/20 sticky bottom-0">
        <ChatInput />
      </div>
    </div>
  );
};
