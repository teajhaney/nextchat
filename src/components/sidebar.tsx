'use client';
import React, { useState } from 'react';
import { MessageSquareDot } from 'lucide-react';
import { sidebarItems } from '@/constants';
import { ChatListBar, SettingsBar } from '@/components';
import clsx from 'clsx';
export const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(sidebarItems[0].title); // Default to 'Chats'
  return (
    <div className="flex h-screen">
      {/* Primary Sidebar */}
      <aside className=" h-screen w-20  border-r border-r-primary bg-background px-2 py-5 flex flex-col justify-between items-center">
        <div className="flex flex-col items-center gap-10">
          {' '}
          <MessageSquareDot className="text-primary size-10" />
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
        <div>nkrnfof</div>
      </aside>
      {/* Secondary Sidebar */}
      <aside className="h-screen w-64  border-r border-r-primary bg-background px-2 py-5 flex flex-col justify-between items-center">
        {activeItem === 'Chats' && <ChatListBar />}
        {activeItem === 'Settings' && <SettingsBar />}
      </aside>
    </div>
  );
};
