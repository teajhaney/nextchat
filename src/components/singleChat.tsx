'use client';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMessageStore } from '@/app/store/messageStore';
import { useAuthStore } from '@/app/store/authStore';
// import { Check, CheckCheck } from 'lucide-react';
import { LoadingSpinner, ReadReceipt } from '@/components';

export const SingleChat = () => {
  const {
    messages,
    selectedChatUser,
    fetchMessages,
    isLoading,
    subscribeToMessages,
    clearOldMessages,
  } = useMessageStore();

  const { user, userData } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (messages.length === 0) return;

    const sentMessage = messages[messages.length - 1];
    const isOwnMessage = sentMessage?.sender_id === user?.id;

    // Always scroll on initial load or when user sends a message
    if (isInitialLoad || isOwnMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [messages, user?.id, isInitialLoad]);

  // Reset when switching chats
  useEffect(() => {
    setIsInitialLoad(true);
  }, []);

  useEffect(() => {
    if (selectedChatUser) {
      subscribeToMessages();
      fetchMessages(selectedChatUser.id);
      clearOldMessages();
    }
  }, [selectedChatUser, fetchMessages, subscribeToMessages, clearOldMessages, user]);

  if (isLoading) {
    return (
      <div className="center-col items-center justify-center p-8">
        <LoadingSpinner className="size-6 border-2 border-primary border-dashed" />
        <span className="ml-2 text-primary/50">Loading messages...</span>
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="center-col items-center justify-center p-8">
        <p className="ml-2 text-primary">No message available</p>
      </div>
    );
  }
  return (
    <div className="p-2">
      {messages.map(message => {
        const isOwnMessage = message.sender_id === user?.id;
        const avatar = isOwnMessage ? userData?.avatar_url : selectedChatUser?.avatar_url;
        return (
          <div
            key={message.id}
            className={`flex items-start gap-2 mb-4  ${
              isOwnMessage ? 'flex-row-reverse items-end' : ''
            }`}
          >
            <Image src={avatar} alt="User Avatar" width={40} height={40} className="rounded-full" />
            <div
              className={`relative text-sm p-2 shadow rounded-b-lg max-w-10/12 ${
                isOwnMessage ? 'bg-primary/20 rounded-tl-lg ' : 'rounded-tr-lg bg-gray100 '
              }`}
            >
              <Suspense fallback={'loading..'}>
                <p className="text-gray-800">{message.content}</p>
              </Suspense>

              <div className="flex gap-2  justify-between items-center">
                <div className={`text-[8px] mt-1 text-primary `}>
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {/* Only showing check marks for own messages */}
                {isOwnMessage && (
                  <ReadReceipt
                    isRead={message.is_read}
                    isSentByCurrentUser={isOwnMessage}
                    isPending={message.isPending}
                  />
                )}
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>
        );
      })}
    </div>
  );
};
