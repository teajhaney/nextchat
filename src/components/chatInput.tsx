import React from 'react';
import { Input, MessageInputOptions } from '@/components';

export const ChatInput = () => {
  return (
    <div className="flex gap-2">
      {' '}
      <Input
        type="text"
        placeholder="Type your message"
        className=" relative px-2 py-5 border-none focus:border-none focus:outline-none bg-gray200 w-full"
      />
      <div className=" ">
        <MessageInputOptions />
      </div>
    </div>
  );
};
