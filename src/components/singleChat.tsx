'use client';
import React from 'react';
import Image from 'next/image';

// Simulate message data with sender info (replace with your store or API later)
const messages = Array.from({ length: 20 }).map((_, index) => ({
  id: index,
  text: 'Hello! This is a message bubble example.',
  sender: index % 2 === 0 ? 'currentUser' : 'otherUser', // Alternate for demo
}));

export const SingleChat = () => {
  return (
    <div className="p-2">
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex items-start gap-2 mb-4  ${
            message.sender === 'currentUser' ? 'flex-row-reverse items-end' : ''
          }`}
        >
          <Image
            src="/images/google.svg"
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div
            className={`relative bg-gray-100 text-sm px-4 py-2 shadow rounded-b-lg max-w-10/12${
              message.sender === 'currentUser' ? 'rounded-tl-lg ' : 'rounded-tr-lg'
            }`}
          >
            <p className="text-gray-800">{message.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
