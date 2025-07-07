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

import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/actions/logout.action';

export const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(sidebarItems[0].title); // Default to 'Chats'
  const { userData, clearAuth } = useAuthStore(state => state);
  const router = useRouter();
  useEffect(() => {
    gsap.fromTo(
      '.secondary-sidebar',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
    );
  }, [activeItem]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearAuth();
      localStorage.removeItem('nextchat_auth');
      router.replace('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

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
        <div className="flex flex-col items-center gap-2">
          <LogOut
            className="text-red-600 cursor-pointer"
            onClick={handleLogout}
          />
          <div>
            <Image
              src={userData?.avatar_url || avatarUrl}
              alt={userData?.full_name || 'logged in user image'}
              width={24}
              height={24}
              className="h-auto w-auto rounded-full"
            />
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
