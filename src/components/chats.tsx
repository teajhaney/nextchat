'use client';
import { useMessageStore } from '@/app/store/messageStore';
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Image from 'next/image';
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
  return (
    <main ref={chatsRef} className=" p-2">
      {Array.from({ length: 20 }).map((_, index) => (
        <div key={index} className="flex items-start gap-2 mb-4">
          <Image
            src="/images/google.svg"
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="relative bg-gray100  text-sm px-4 py-2 rounded-tr-lg rounded-b-lg  shadow max-w-10/12">
            <p className="text-textColor ">
              Hello! This is a message bubble example.
				  </p>
			
          </div>
        </div>
      ))}
    </main>
  );
};
