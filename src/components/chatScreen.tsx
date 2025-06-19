import React from 'react';
import { MessageData } from '@/index';
export const ChatScreen = ({ currentMessageUser }: { currentMessageUser: MessageData }) => {
  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">Chatting with {currentMessageUser.full_name}</h1>
      {/* Chat UI here */}
    </div>
  );
};
