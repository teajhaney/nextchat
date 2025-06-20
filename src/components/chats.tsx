'use client';
import { useMessageStore } from '@/app/store/messageStore';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const Chats = () => {
  const { selectedChatUser } = useMessageStore(state => state);

  const chatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatsRef.current) {
      gsap.fromTo(
        chatsRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.0, ease: 'power2.inOut' }
      );
    }
  }, [selectedChatUser]);
  return <main ref={chatsRef}>Chats</main>;
};
