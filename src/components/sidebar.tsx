'use client';
import React, { useEffect, useState } from 'react';
import { MessageSquareDot } from 'lucide-react';
import { sidebarItems } from '@/constants';
import { ChatListBar, SettingsBar } from '@/components';
import clsx from 'clsx';
import Image from 'next/image';
import gsap from 'gsap';
import Link from 'next/link';
export const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(sidebarItems[0].title); // Default to 'Chats'
  //
  useEffect(() => {
    gsap.fromTo(
      '.secondary-sidebar',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
    );
  }, [activeItem]);
  return (
    <div className="flex h-screen">
      {/* Primary Sidebar */}
      <aside className=" h-screen w-20  border-r border-r-primary bg-background px-2 py-5 flex flex-col justify-between items-center">
        <div className="flex flex-col items-center gap-5">
          {' '}
          <Link href="/chat">
            <MessageSquareDot className="text-primary size-10 cursor-pointer" />
          </Link>
          {sidebarItems.map(({ title, icon: Icon }) => (
            <div
              key={title}
              onClick={() => setActiveItem(title)}
              className={clsx(
                'size-10 center cursor-pointer',
                activeItem === title && 'bg-primary  rounded-md'
              )}
            >
              <Icon
                className={clsx(
                  'text-textColor size-6 cursor-pointer',
                  activeItem === title && 'text-white  rounded-md'
                )}
              />
            </div>
          ))}
        </div>
        <div>
          {' '}
          <Image
            src="/images/google.svg"
            alt="google logo"
            width={24}
            height={24}
            className="h-auto w-auto"
          />
        </div>
      </aside>
      {/* Secondary Sidebar */}
      <aside className="h-screen w-64 border-r border-r-primary bg-background px-2 py-5 ">
        <div className="secondary-sidebar w-full h-full">
          {activeItem === 'Chats' && <ChatListBar />}
          {activeItem === 'Settings' && <SettingsBar />}
        </div>
      </aside>
    </div>
  );
};
