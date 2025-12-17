'use client';
import React, { useEffect, useState } from 'react';
import { LogOut, MessageSquareDot } from 'lucide-react';
import { avatarUrl, sidebarItems } from '@/constants';
import { ChatListBar, SettingsBar } from '@/components';
import clsx from 'clsx';
import Image from 'next/image';
import gsap from 'gsap';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(sidebarItems[0].title); // Default to 'Chats'
  const { userData, user } = useAuthStore(state => state);
  useEffect(() => {
    gsap.fromTo(
      '.secondary-sidebar',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
    );
  }, [activeItem]);

  const handleLogout = async () => {
    // Navigate immediately without clearing state first - prevents showing data disappearing
    // The middleware will handle signout and redirect, auth state will be cleared by auth state change listener
    window.location.href = '/logout';
  };

  const displayName =
    userData?.full_name ||
    userData?.email ||
    user?.user_metadata?.full_name ||
    user?.email ||
    'You';

  const displayAvatar =
    userData?.avatar_url || user?.user_metadata?.avatar_url || avatarUrl;

  return (
    <div className="flex h-screen max-lg:w-full">
      {/* Primary Sidebar */}
      <aside className=" h-screen w-20  border-r border-r-primary bg-background px-2 py-5 flex flex-col  items-center gap-10">
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
        <div className="flex flex-col items-center gap-2 mt-auto pb-4">
          <LogOut
            className="text-red-600 cursor-pointer"
            onClick={handleLogout}
          />
          <div className="flex flex-col items-center">
            <Image
              src={displayAvatar}
              alt={displayName || 'logged in user image'}
              width={12}
              height={12}
              className="size-10 rounded-full object-cover"
            />
            <p className="text-[10px] text-white text-center max-w-[64px] truncate">
              {displayName}
            </p>
          </div>
        </div>
      </aside>
      {/* Secondary Sidebar */}
      <aside className="max-lg:w-full h-screen lg:w-96 lg:border-r border-r-primary bg-background ">
        <div className="secondary-sidebar w-full h-full">
          {activeItem === 'Chats' && <ChatListBar />}
          {activeItem === 'Settings' && <SettingsBar />}
        </div>
      </aside>
    </div>
  );
};
