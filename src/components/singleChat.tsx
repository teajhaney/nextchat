'use client';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMessageStore } from '@/app/store/messageStore';
import { useAuthStore } from '@/app/store/authStore';
import { LoadingSpinner, ReadReceipt } from '@/components';

export const SingleChat = () => {
  const {
    messages,
    selectedChatUser,
    fetchMessages,
    isLoading,
    subscribeToMessages,
    clearOldMessages,
    markMessagesAsRead,
  } = useMessageStore();

  const { user, userData } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const visibilityCheckTimeoutRef = useRef<NodeJS.Timeout>(null);
  const prevMessagesLengthRef = useRef<number>(0);

  // Scroll to bottom on initial load or new message
  useEffect(() => {
    if (messages.length === 0) return;

    const sentMessage = messages[messages.length - 1];
    const isOwnMessage = sentMessage?.sender_id === user?.id;

    if (isInitialLoad || isOwnMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [messages, user?.id, isInitialLoad]);

  // Check message visibility when scrolling, resizing, or when new messages arrive
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !selectedChatUser || !user) return;

    const checkVisibleMessages = () => {
      // Clear any pending checks
      if (visibilityCheckTimeoutRef.current) {
        clearTimeout(visibilityCheckTimeoutRef.current);
      }

      // Schedule a new check with a small delay to avoid rapid firing
      visibilityCheckTimeoutRef.current = setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const messageElements = container.querySelectorAll('[data-message-id]');

        const visibleMessageIds: string[] = [];

        messageElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          // Check if at least 50% of the message is visible in container
          if (
            rect.top <= containerRect.bottom - rect.height * 0.5 &&
            rect.bottom >= containerRect.top + rect.height * 0.5
          ) {
            const messageId = el.getAttribute('data-message-id');
            if (messageId) visibleMessageIds.push(messageId);
          }
        });

        // Only mark messages from the other user that are unread AND visible
        const unreadMessages = messages.filter(
          msg =>
            msg.sender_id === selectedChatUser.id &&
            msg.recipient_id === user.id &&
            !msg.is_read &&
            visibleMessageIds.includes(msg.id)
        );

        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg.id);
          markMessagesAsRead(messageIds);
        }
      }, 300); // 300ms delay after scroll stops
    };

    container.addEventListener('scroll', checkVisibleMessages);
    window.addEventListener('resize', checkVisibleMessages);

    // Check if new messages arrived and trigger visibility check
    if (messages.length !== prevMessagesLengthRef.current) {
      checkVisibleMessages();
      prevMessagesLengthRef.current = messages.length;
    }

    // Initial check
    checkVisibleMessages();

    return () => {
      container.removeEventListener('scroll', checkVisibleMessages);
      window.removeEventListener('resize', checkVisibleMessages);
      if (visibilityCheckTimeoutRef.current) {
        clearTimeout(visibilityCheckTimeoutRef.current);
      }
    };
  }, [messages, user, selectedChatUser, markMessagesAsRead]);

  // Initial setup
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
    <div
      className="h-full overflow-y-auto scrollbar-hide"
      ref={chatContainerRef}
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {messages.map(message => {
        const isOwnMessage = message.sender_id === user?.id;
        const avatar = isOwnMessage ? userData?.avatar_url : selectedChatUser?.avatar_url;
        return (
          <div
            key={message.id}
            data-message-id={message.id}
            className={`flex items-start gap-2 mb-4 ${
              isOwnMessage ? 'flex-row-reverse items-end' : ''
            }`}
          >
            <Image src={avatar} alt="User Avatar" width={40} height={40} className="rounded-full" />
            <div
              className={`relative text-sm p-2 shadow rounded-b-lg max-w-10/12 ${
                isOwnMessage ? 'bg-primary/20 rounded-tl-lg' : 'rounded-tr-lg bg-gray100'
              }`}
            >
              <p className="text-gray-800">{message.content}</p>
              <div className="flex gap-2 justify-between items-center">
                <div className={`text-[8px] mt-1 text-primary`}>
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {isOwnMessage && (
                  <ReadReceipt
                    isRead={message.is_read}
                    isSentByCurrentUser={isOwnMessage}
                    isPending={message.isPending}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};




