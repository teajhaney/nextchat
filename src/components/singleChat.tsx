'use client';
import React, { useEffect } from 'react';
import Image from 'next/image';
import { useMessageStore } from '@/app/store/messageStore';
import { useAuthStore } from '@/app/store/authStore';

export const SingleChat = () => {
  const {
    messages,
    selectedChatUser,

    fetchMessages,
    subscribeToMessages,
  } = useMessageStore();

  const { user, userData } = useAuthStore();

  useEffect(() => {
    if (selectedChatUser) {
      console.log('selected user ID:', selectedChatUser?.id); // Debug log
      fetchMessages(selectedChatUser.id);
      subscribeToMessages();
    }
  }, [selectedChatUser, , fetchMessages, subscribeToMessages, , user]);

  return (
    <div className="p-2">
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex items-start gap-2 mb-4  ${
            message.sender_id === user?.id ? 'flex-row-reverse items-end' : ''
          }`}
        >
          <Image
            src={
              message.sender_id === user?.id ? userData?.avatar_url : selectedChatUser?.avatar_url
            }
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div
            className={`relative bg-gray-100 text-sm px-4 py-2 shadow rounded-b-lg max-w-10/12${
              message.sender_id === user?.id ? 'rounded-tl-lg ' : 'rounded-tr-lg'
            }`}
          >
            <p className="text-gray-800">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
