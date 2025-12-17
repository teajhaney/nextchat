'use client';
import { useAuthStore } from '@/store/authStore';
import React, { useState } from 'react';
import { Input, LoadingSpinner, ChatList, RecentChats } from '@/components';
import { AddUserDialog } from './addUserDialog';
import { CirclePlus, FunnelPlus } from 'lucide-react';

export const ChatListBar = () => {
  const { loading } = useAuthStore(state => state);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  if (loading)
    return (
      <div>
        <LoadingSpinner className="border-primary h-6 w-6 border-dashed border-2" />
      </div>
    );

  return (
    <>
      <aside className="px-3 pt-5 space-y-5 h-full overflow-y-auto scrollbar-hide">
        {/* header */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Chats</h1>
            <div
              className="cursor-pointer"
              onClick={() => setIsAddUserDialogOpen(true)}
            >
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
        <div className="py-2 h-ful">
          <ChatList />
        </div>
      </aside>
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
      />
    </>
  );
};
