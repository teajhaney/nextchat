'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner, ReadReceipt } from '@/components';
import { ChevronDown } from 'lucide-react';

export const SingleChat = () => {
  // Message threshold for auto-scroll (how many messages below viewport before showing badge)
  const MESSAGE_THRESHOLD = 10;
  // Button visibility threshold - show button as soon as user scrolls up
  const BUTTON_VISIBILITY_THRESHOLD = 1;

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
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [buttonRight, setButtonRight] = useState(16); // Default right position in px
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(
    null
  );
  const prevMessagesLengthRef = useRef<number>(0);
  const visibilityCheckTimeoutRef = useRef<NodeJS.Timeout>(null);
  const lastButtonVisibilityRef = useRef<boolean>(false);
  const isUserScrollingRef = useRef(false);

  // Track scroll position using message count (like modern chat apps)
  useEffect(() => {
    // Find the scrollable parent container
    const findScrollContainer = () => {
      let element = chatContainerRef.current?.parentElement;
      while (element) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    const container = findScrollContainer();
    if (!container || !selectedChatUser || !user) return;

    // Store container ref for button positioning
    scrollContainerRef.current = container;

    const checkScrollPosition = () => {
      const containerRect = container.getBoundingClientRect();
      const messageElements =
        chatContainerRef.current?.querySelectorAll('[data-message-id]') || [];

      // Count messages that are below the visible area (not yet scrolled to)
      let messagesBelowViewport = 0;
      const viewportBottom = containerRect.bottom;

      messageElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // If message bottom is below viewport bottom, it's not visible
        if (rect.bottom > viewportBottom) {
          messagesBelowViewport++;
        }
      });

      // Consider "near bottom" if there are MESSAGE_THRESHOLD or fewer messages below viewport
      // This matches modern chat app behavior (WhatsApp, Telegram, Discord)
      const isNearBottom = messagesBelowViewport <= MESSAGE_THRESHOLD;

      // Show button earlier using smaller threshold - appears as soon as user scrolls up slightly
      const shouldShowButton =
        messagesBelowViewport > BUTTON_VISIBILITY_THRESHOLD;

      setIsNearBottom(isNearBottom);

      // Only update button visibility if it actually changed to prevent flickering
      if (lastButtonVisibilityRef.current !== shouldShowButton) {
        setShowScrollButton(shouldShowButton);
        lastButtonVisibilityRef.current = shouldShowButton;
      }

      isUserScrollingRef.current = true;

      // Reset scrolling flag after a delay
      setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 150);
    };

    container.addEventListener('scroll', checkScrollPosition);
    // Also check on resize
    window.addEventListener('resize', checkScrollPosition);
    // Initial check
    checkScrollPosition();

    // Calculate button position relative to container
    const updateButtonPosition = () => {
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        // Calculate right position: distance from container's right edge to viewport's right edge + padding
        const right = viewportWidth - containerRect.right + 16; // 16px padding
        setButtonRight(right);
      }
    };

    updateButtonPosition();
    window.addEventListener('resize', updateButtonPosition);
    window.addEventListener('scroll', updateButtonPosition, true); // Use capture to catch all scrolls

    return () => {
      container.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
      window.removeEventListener('resize', updateButtonPosition);
      window.removeEventListener('scroll', updateButtonPosition, true);
    };
  }, [messages.length, selectedChatUser, user]);

  // SCROLL to bottom on initial load or when user sends a message
  useEffect(() => {
    if (messages.length === 0 || !messagesEndRef.current) return;

    const sentMessage = messages[messages.length - 1];
    const isOwnMessage = sentMessage?.sender_id === user?.id;

    // Check if this is a new message (not initial load)
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    // Always scroll to bottom on initial load
    if (isInitialLoad) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      setIsInitialLoad(false);
      setIsNearBottom(true);
      setShowScrollButton(false); // Hide button on initial load
      lastButtonVisibilityRef.current = false;
      setUnreadCount(0);
      return;
    }

    // Always scroll when user sends their own message
    if (isOwnMessage && isNewMessage) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsNearBottom(true);
      setShowScrollButton(false); // Hide button when user sends message
      lastButtonVisibilityRef.current = false;
      setUnreadCount(0);
      return;
    }

    // For new messages from other user - auto-scroll only if within last 3 messages
    if (isNewMessage && !isOwnMessage) {
      // Find scroll container to check position using message count
      const findScrollContainer = () => {
        let element = chatContainerRef.current?.parentElement;
        while (element) {
          const style = window.getComputedStyle(element);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return element;
          }
          element = element.parentElement;
        }
        return null;
      };

      const container = findScrollContainer();
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const messageElements =
          chatContainerRef.current?.querySelectorAll('[data-message-id]') || [];

        // Count messages below viewport (not yet visible)
        let messagesBelowViewport = 0;
        const viewportBottom = containerRect.bottom;

        messageElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.bottom > viewportBottom) {
            messagesBelowViewport++;
          }
        });

        // Auto-scroll if within last MESSAGE_THRESHOLD messages
        const shouldAutoScroll = messagesBelowViewport <= MESSAGE_THRESHOLD;

        // Count all unread messages
        const allUnreadMessages = messages.filter(
          msg =>
            msg.sender_id === selectedChatUser?.id &&
            msg.recipient_id === user?.id &&
            !msg.is_read
        );

        if (shouldAutoScroll) {
          // User is near bottom (within last 3 messages) - auto-scroll and mark as read
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          setIsNearBottom(true);

          if (allUnreadMessages.length > 0) {
            const messageIds = allUnreadMessages.map(msg => msg.id);
            const lastMessageId =
              allUnreadMessages[allUnreadMessages.length - 1]?.id;
            markMessagesAsRead(messageIds);
            setLastReadMessageId(lastMessageId);
          }
          setUnreadCount(0);
        } else {
          // User is scrolled up (more than 3 messages away) - show notification badge
          setUnreadCount(allUnreadMessages.length);
          setIsNearBottom(false);
        }
      } else {
        // Can't find container - assume not at bottom and show notification
        const allUnreadMessages = messages.filter(
          msg =>
            msg.sender_id === selectedChatUser?.id &&
            msg.recipient_id === user?.id &&
            !msg.is_read
        );
        setUnreadCount(allUnreadMessages.length);
        setIsNearBottom(false);
      }
    }
  }, [
    messages,
    isInitialLoad,
    user?.id,
    isNearBottom,
    selectedChatUser?.id,
    lastReadMessageId,
    markMessagesAsRead,
  ]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (!selectedChatUser || !user || messages.length === 0) return;

    // Mark all unread messages from the other user as read immediately when chat opens
    const unreadMessages = messages.filter(
      msg =>
        msg.sender_id === selectedChatUser.id &&
        msg.recipient_id === user.id &&
        !msg.is_read
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      const lastMessageId = unreadMessages[unreadMessages.length - 1]?.id;
      markMessagesAsRead(messageIds);
      setLastReadMessageId(lastMessageId);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatUser?.id, user?.id]); // Only run when chat user changes

  // Handle scroll to bottom button click
  const handleScrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsNearBottom(true);
      setShowScrollButton(false); // Hide button when user clicks to scroll to bottom
      lastButtonVisibilityRef.current = false;

      // Mark all unread messages as read when user clicks to scroll to bottom
      if (selectedChatUser && user) {
        const unreadMessages = messages.filter(
          msg =>
            msg.sender_id === selectedChatUser.id &&
            msg.recipient_id === user.id &&
            !msg.is_read
        );

        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(msg => msg.id);
          const lastMessageId = unreadMessages[unreadMessages.length - 1]?.id;
          markMessagesAsRead(messageIds);
          setLastReadMessageId(lastMessageId);
          setUnreadCount(0);
        }
      }
    }
  };

  // CHECK message visibility when scrolling - mark as read when user scrolls to see them
  useEffect(() => {
    // Find the scrollable parent container
    const findScrollContainer = () => {
      let element = chatContainerRef.current?.parentElement;
      while (element) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    const container = findScrollContainer();
    if (!container || !selectedChatUser || !user) return;

    const checkVisibleMessages = () => {
      // Clear any pending checks
      if (visibilityCheckTimeoutRef.current) {
        clearTimeout(visibilityCheckTimeoutRef.current);
      }

      // Schedule a new check with minimal delay
      visibilityCheckTimeoutRef.current = setTimeout(() => {
        const visContainerRect = container.getBoundingClientRect();
        const visMessageElements =
          chatContainerRef.current?.querySelectorAll('[data-message-id]') || [];

        const visibleMessageIds: string[] = [];
        let messagesBelowViewport = 0;
        const viewportBottom = visContainerRect.bottom;

        // Single pass through messages to check visibility and count below viewport
        visMessageElements.forEach(el => {
          const rect = el.getBoundingClientRect();

          // Check if message is visible (at least 50% visible)
          const messageHeight = rect.height;
          const visibleHeight =
            Math.min(rect.bottom, visContainerRect.bottom) -
            Math.max(rect.top, visContainerRect.top);

          if (visibleHeight >= messageHeight * 0.5) {
            const messageId = el.getAttribute('data-message-id');
            if (messageId) visibleMessageIds.push(messageId);
          }

          // Count messages below viewport
          if (rect.bottom > viewportBottom) {
            messagesBelowViewport++;
          }
        });

        // Check if near bottom using message count
        const isNearBottomByMessages =
          messagesBelowViewport <= MESSAGE_THRESHOLD;

        // Only mark messages from the other user that are unread AND visible
        const visibleUnreadMessages = messages.filter(
          msg =>
            msg.sender_id === selectedChatUser.id &&
            msg.recipient_id === user.id &&
            !msg.is_read &&
            visibleMessageIds.includes(msg.id)
        );

        if (visibleUnreadMessages.length > 0) {
          const messageIds = visibleUnreadMessages.map(msg => msg.id);
          const lastMessageId =
            visibleUnreadMessages[visibleUnreadMessages.length - 1]?.id;
          markMessagesAsRead(messageIds);
          setLastReadMessageId(lastMessageId);
        }

        // Get all unread messages for count update
        const allUnreadMessages = messages.filter(
          msg =>
            msg.sender_id === selectedChatUser.id &&
            msg.recipient_id === user.id &&
            !msg.is_read
        );

        if (isNearBottomByMessages) {
          setIsNearBottom(true);
          // If near bottom (within last 3 messages), mark all unread messages as read
          if (allUnreadMessages.length > 0) {
            const messageIds = allUnreadMessages.map(msg => msg.id);
            const lastMessageId =
              allUnreadMessages[allUnreadMessages.length - 1]?.id;
            markMessagesAsRead(messageIds);
            setLastReadMessageId(lastMessageId);
            setUnreadCount(0);
          }
        } else {
          setIsNearBottom(false);
          // Update unread count
          setUnreadCount(allUnreadMessages.length);
        }
        // Note: Button visibility is managed by checkScrollPosition handler only
        // to avoid conflicts and flickering
      }, 200); // Small delay to avoid rapid firing
    };

    container.addEventListener('scroll', checkVisibleMessages);
    window.addEventListener('resize', checkVisibleMessages);

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

  // Message setup
  useEffect(() => {
    if (selectedChatUser) {
      subscribeToMessages();
      fetchMessages(selectedChatUser.id);
      clearOldMessages();
    }
  }, [
    selectedChatUser,
    fetchMessages,
    subscribeToMessages,
    clearOldMessages,
    user,
  ]);

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
    <div className="relative h-full" ref={chatContainerRef}>
      {messages.map(message => {
        const isOwnMessage = message.sender_id === user?.id;
        const avatar = isOwnMessage
          ? userData?.avatar_url
          : selectedChatUser?.avatar_url;
        return (
          <div
            key={message.id}
            data-message-id={message.id}
            className={`flex items-start gap-2 mb-2 ${
              isOwnMessage ? 'flex-row-reverse items-end' : ''
            }`}
          >
            <Image
              src={avatar || '/images/google.svg'}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div
              className={`relative text-sm p-2 shadow rounded-b-lg max-w-10/12 ${
                isOwnMessage
                  ? 'bg-primary/20 rounded-tl-lg'
                  : 'rounded-tr-lg bg-gray100'
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
      <div ref={messagesEndRef} className="h-0" />

      {/*  scroll-to-bottom button - show immediately when scroll is detected */}
      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          style={{ right: `${buttonRight}px`, bottom: '80px' }}
          className="fixed mb-3 size-10 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-6 h-6 transition-transform group-hover:translate-y-0.5" />
          {/* Unread count badge - show when there are new messages */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center border-2 border-white shadow-md">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
