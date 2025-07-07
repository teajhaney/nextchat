'use client';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { useMessageStore } from '@/store/messageStore';
import clsx from 'clsx';
import { useEffect } from 'react';

export const ChatList = () => {
  const { otherUserData, user } = useAuthStore(state => state);
  const {
    setSelectedChatUser,
    selectedChatUser,
    lastMessages,
    fetchLastMessagesForAllChats,
  } = useMessageStore(state => state);

  // Fetch last messages when component mounts
  useEffect(() => {
    if (user) {
      fetchLastMessagesForAllChats();
    }
  }, [user, fetchLastMessagesForAllChats]);

  if (!otherUserData || otherUserData.length === 0) {
    return <p>No other users found.</p>;
  }

  const getLastMessage = (userId: string) => {
    const lastMessageData = lastMessages.find(lm => lm.otherUserId === userId);
    return lastMessageData?.lastMessage;
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

  return (
    <div className="space-y-3 ">
      {otherUserData.map(({ id, full_name, avatar_url, email }) => {
        const selectedChat = selectedChatUser?.id === id;
        const lastMessage = getLastMessage(id);
        const isOwnMessage = lastMessage?.sender_id === user?.id;

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
              <Image
                src={avatar_url || avatarUrl}
                alt={full_name}
                width={30}
                height={30}
                className="size-10 rounded-full"
              />
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
            <div className="flex flex-col justify-between">
              <h1 className="text-xs text-gray">
                {lastMessage ? formatTime(lastMessage.created_at) : ''}
              </h1>
              <h1>icons</h1>
            </div>
          </div>
        );
      })}
    </div>
  );
};
