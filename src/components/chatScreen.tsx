'use client';
import React from 'react';
import { ChatHeader } from './chatHeader';

export const ChatScreen = () => {
  return (
    <div className="h-screen flex flex-col">
      <div>
        <ChatHeader />
      </div>
      <div className="flex-1 bg-primary"></div>
      {/* chat input */}
      <div></div>
    </div>
  );
};
