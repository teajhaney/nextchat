'use client';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
import { avatarUrl } from '@/constants';
import { ChatOptions } from '@/components';
import { useMessageStore } from '@/app/store/messageStore';

export const ChatHeader = () => {
  const { selectedChatUser } = useMessageStore(state => state);

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
      );
    }
  }, [selectedChatUser]);

  return (
    <div className="p-3 flex justify-between items-center shadow rounded-sm cursor-pointer">
      <div className="chat-screen flex items-center gap-2" ref={headerRef}>
        <Image
          src={selectedChatUser?.avatar_url || avatarUrl}
          alt={selectedChatUser?.full_name || 'user avatar'}
          width={40}
          height={40}
          className="size-15 rounded-full"
        />
        <div className="flex flex-col justify-between">
          <h1 className="font-bold">{selectedChatUser?.full_name}</h1>
          <h1 className="text-xs text-gray">online</h1>
        </div>
      </div>
      <div>
        <ChatOptions />
      </div>
    </div>
  );
};
