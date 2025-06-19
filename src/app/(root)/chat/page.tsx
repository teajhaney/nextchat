'use client';

import { ChatScreen, NoChatScreen } from '@/components';

import { useMessageStore } from '@/app/store/messageStore';
const Chat = () => {
  const { selectedChatUser } = useMessageStore((state => state));
  return (
    <main className="">
      {selectedChatUser ? <ChatScreen currentMessageUser={selectedChatUser} /> : <NoChatScreen />}
    </main>
  );
};

export default Chat;
