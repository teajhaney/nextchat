'use client';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { useMessageStore } from '@/store/messageStore';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import {
  initializePresence,
  subscribeToPresence,
  unsubscribeFromPresence,
} from '@/lib/services/presenceService';
import { ChatListSkeleton } from '@/components';

export const ChatList = () => {
  const { otherUserData, user, loading } = useAuthStore(state => state);
  const {
    setSelectedChatUser,
    selectedChatUser,
    lastMessages,
    unreadCounts,
    fetchChatData,
    isChatDataLoading,
    subscribeToUnreadCounts,
    unsubscribeFromUnreadCounts,
  } = useMessageStore(state => state);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(
    new Map()
  );

  // Fetch last messages and unread counts when component mounts (optimized: single call)
  useEffect(() => {
    if (user) {
      // Initialize presence tracking
      initializePresence();

      // Fetch chat data (lastMessages and unreadCounts) when user is available
      fetchChatData();

      // Subscribe to realtime unread count updates (fire and forget)
      subscribeToUnreadCounts().catch(error => {
        console.error('Failed to subscribe to unread counts:', error);
      });
    }

    // Cleanup subscription on unmount
    return () => {
      if (user) {
        unsubscribeFromUnreadCounts();
      }
    };
  }, [
    user,
    fetchChatData,
    subscribeToUnreadCounts,
    unsubscribeFromUnreadCounts,
  ]);

  // Subscribe to presence for all users in the chat list
  useEffect(() => {
    if (!otherUserData || otherUserData.length === 0) return;

    // Subscribe to presence for each user
    otherUserData.forEach(({ id }) => {
      subscribeToPresence(id, isOnline => {
        setOnlineUsers(prev => {
          const updated = new Map(prev);
          updated.set(id, isOnline);
          return updated;
        });
      });
    });

    // Cleanup subscriptions on unmount or when users change
    return () => {
      otherUserData.forEach(({ id }) => {
        unsubscribeFromPresence(id);
      });
    };
  }, [otherUserData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500 text-sm">Loading users...</p>
      </div>
    );
  }

  if (!otherUserData || otherUserData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No other users found.</p>
        {user && (
          <p className="text-xs mt-2">
            Make sure other users have signed up and are in the database.
          </p>
        )}
      </div>
    );
  }

  const getLastMessage = (userId: string) => {
    const lastMessageData = lastMessages.find(lm => lm.otherUserId === userId);
    return lastMessageData?.lastMessage;
  };

  const getUnreadCount = (userId: string) => {
    const unreadData = unreadCounts.find(uc => uc.otherUserId === userId);
    return unreadData?.count || 0;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Show loading skeleton while chat data is being fetched (prevents "no message yet" flash)
  if (isChatDataLoading && lastMessages.length === 0) {
    return (
      <ChatListSkeleton
        count={otherUserData.length}
        showAvatar={true}
        showTitle={true}
        showSubtitle={true}
        showTimestamp={true}
        showBadge={false}
      />
    );
  }

  // Filter to only show users who have messages (chats that have been started)
  const usersWithMessages = otherUserData.filter(user => {
    const lastMessage = getLastMessage(user.id);
    return lastMessage !== undefined; // Only show users with messages
  });

  if (usersWithMessages.length === 0 && !isChatDataLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No chats yet.</p>
        <p className="text-xs mt-2">
          Start a conversation by adding a new contact.
        </p>
      </div>
    );
  }

  // Sort chats by last message timestamp (most recent first)
  const sortedChats = [...usersWithMessages].sort((a, b) => {
    const lastMessageA = getLastMessage(a.id);
    const lastMessageB = getLastMessage(b.id);

    // Both should have messages at this point, but handle edge cases
    if (!lastMessageA && !lastMessageB) return 0;
    if (!lastMessageA) return 1;
    if (!lastMessageB) return -1;

    // Sort by timestamp (newest first)
    return (
      new Date(lastMessageB.created_at).getTime() -
      new Date(lastMessageA.created_at).getTime()
    );
  });

  return (
    <div className="space-y-3 ">
      {sortedChats.map(({ id, full_name, avatar_url, email }) => {
        const selectedChat = selectedChatUser?.id === id;
        const lastMessage = getLastMessage(id);
        const isOwnMessage = lastMessage?.sender_id === user?.id;
        const unreadCount = getUnreadCount(id);

        return (
          <div
            key={id}
            onClick={() =>
              setSelectedChatUser({ id, full_name, avatar_url, email })
            }
            className={clsx(
              'p-3 flex justify-between items-center shadow rounded-sm cursor-pointer',
              selectedChat && 'border border-primary'
            )}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Image
                  src={avatar_url || avatarUrl}
                  alt={full_name}
                  width={30}
                  height={30}
                  className="size-10 rounded-full"
                />
                {/* Online indicator - primary color circle on top right */}
                {onlineUsers.get(id) && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-1 border-white"></span>
                )}
              </div>
              <div className="flex flex-col justify-between">
                <h1 className={clsx(selectedChat && 'font-bold')}>
                  {full_name}
                </h1>
                <h1 className="text-xs text-gray">
                  {lastMessage ? (
                    <span>
                      {isOwnMessage ? 'You: ' : ''}
                      {lastMessage.content.length > 30
                        ? `${lastMessage.content.substring(0, 30)}...`
                        : lastMessage.content}
                    </span>
                  ) : (
                    'no message yet'
                  )}
                </h1>
              </div>
            </div>
            <div className="flex flex-col justify-between items-end gap-1">
              <h1 className="text-xs text-gray">
                {lastMessage ? formatTime(lastMessage.created_at) : ''}
              </h1>
              {unreadCount > 0 && (
                <div className="relative">
                  <span className=" -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
