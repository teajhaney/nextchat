'use client';
import { useMessageStore } from '@/app/store/messageStore';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { SingleChat } from '@/components';
export const Chats = () => {
  const { selectedChatUser } = useMessageStore(state => state);

  const chatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatsRef.current) {
      gsap.fromTo(
        chatsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
      );
    }
  }, [selectedChatUser]);
  return (
    <main ref={chatsRef} className=" p-2">
      <SingleChat />
    </main>
  );
};
