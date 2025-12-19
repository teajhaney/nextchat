'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { ChatOptions, ProfileModal } from '@/components';
import { ArrowLeft } from 'lucide-react';
import { useMessageStore } from '@/store/messageStore';
import {
  subscribeToPresence,
  unsubscribeFromPresence,
} from '@/lib/services/presenceService';

export const ChatHeader = () => {
  const { selectedChatUser, setSelectedChatUser, unreadCounts } =
    useMessageStore(state => state);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  // Calculate total unread messages across all chats (excluding current chat)
  const totalUnreadChats = useMemo(() => {
    if (!selectedChatUser) return 0;

    // Filter out the current chat and sum up all unread message counts
    return unreadCounts
      .filter(unread => unread.otherUserId !== selectedChatUser.id)
      .reduce((total, unread) => total + unread.count, 0);
  }, [unreadCounts, selectedChatUser]);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
      );
    }
  }, [selectedChatUser]);

  // Subscribe to presence for selected user
  useEffect(() => {
    if (!selectedChatUser) {
      setIsOnline(false);
      return;
    }

    // Subscribe to presence changes
    subscribeToPresence(selectedChatUser.id, online => {
      setIsOnline(online);
    });

    // Default to checking if user is online (you can enhance this with actual presence)
    // For now, we'll assume online if they're in the system
    setIsOnline(true);

    return () => {
      unsubscribeFromPresence(selectedChatUser.id);
    };
  }, [selectedChatUser]);

  return (
    <div className="p-3 flex justify-between items-center shadow rounded-sm cursor-pointer">
      <div className="chat-screen flex items-center gap-2" ref={headerRef}>
        {/* Back button - visible on mobile always, on desktop when there are unread chats */}
        <button
          onClick={() => setSelectedChatUser(null)}
          className={`p-1 hover:bg-primary rounded relative ${
            totalUnreadChats > 0 ? '' : 'lg:hidden'
          }`}
        >
          <div className="relative">
            <ArrowLeft className="size-5 text-gray-600" />
            {/* Unread chats badge - shows count of unread chats from other conversations */}
            {totalUnreadChats > 0 && (
              <span className="absolute top-0 right-0 text-white text-sm font-semibold">
                {totalUnreadChats > 99 ? '99+' : totalUnreadChats}
              </span>
            )}
          </div>
        </button>

        <Image
          src={selectedChatUser?.avatar_url || avatarUrl}
          alt={selectedChatUser?.full_name || 'user avatar'}
          width={40}
          height={40}
          className="size-10 rounded-full cursor-pointer"
          onClick={() => setIsProfileModalOpen(true)}
        />
        <div className="flex flex-col justify-between">
          <h1 className="font-bold">{selectedChatUser?.full_name}</h1>
          <h1 className={`text-xs ${isOnline ? 'text-primary' : 'text-gray'}`}>
            {isOnline ? 'online' : 'offline'}
          </h1>
        </div>
      </div>
      <div>
        <ChatOptions />
      </div>
      {/* Profile Modal */}
      {selectedChatUser && (
        <ProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          user={selectedChatUser}
          isCurrentUser={false}
        />
      )}
    </div>
  );
};
