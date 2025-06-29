'use client';
import { useAuthStore } from '@/app/store/authStore';
import React from 'react';
import { Input, LoadingSpinner, ChatList, RecentChats } from '@/components';
import { CirclePlus, FunnelPlus } from 'lucide-react';

export const ChatListBar = () => {
  const { loading } = useAuthStore(state => state);

  if (loading)
    return (
      <div>
        <LoadingSpinner className="border-primary h-6 w-6 border-dashed border-2" />
      </div>
    );

  return (
    <aside className="px-3 pt-5 space-y-5">
      {/* header */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Chats</h1>
          <div className="cursor-pointer">
            <CirclePlus className="text-primary size-5" />
          </div>
        </div>

        <div className="">
          <Input
            type="text"
            placeholder="Search for messages or contacts"
            className="px-2 border-none focus:border-none focus:outline-none shadow w-full"
          />
        </div>
      </div>
      {/* recent chat */}
      <div className="flex flex-col gap-2">
        <h1 className="font-bold">Recent chat</h1>
        <div className="">
          <RecentChats />
        </div>
      </div>
      {/* chat header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">All chats</h1>
        <div className="cursor-pointer">
          <FunnelPlus className="text-primary size-5" />
        </div>
      </div>
      <div className="py-2">
        <ChatList />
      </div>
    </aside>
  );
};
