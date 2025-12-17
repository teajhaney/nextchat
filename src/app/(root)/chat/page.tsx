'use client';

import { ChatScreen, NoChatScreen } from '@/components';
import { use } from 'react';
import { useMessageStore } from '@/store/messageStore';

const Chat = ({
  params,
}: {
  params?: Promise<Record<string, string>>;
}) => {
  // Unwrap params to prevent enumeration warning (Next.js 15 compatibility)
  // Always unwrap even if params is undefined to satisfy React hooks rules
  const unwrappedParams = use(params ?? Promise.resolve({}));
  // Suppress unused variable warning - params are unwrapped to prevent enumeration
  void unwrappedParams;
  const { selectedChatUser } = useMessageStore(state => state);

  return (
    <main className="w-full">
      {selectedChatUser ? (
        <div className="chat-screen ">
          <ChatScreen />
        </div>
      ) : (
        <NoChatScreen />
      )}
    </main>
  );
};

export default Chat;
