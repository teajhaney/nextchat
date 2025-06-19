'use client';

import { ChatScreen, NoChatScreen } from '@/components';

import { useMessageStore } from '@/app/store/messageStore';

//

const Chat = () => {
  const { selectedChatUser } = useMessageStore(state => state);

  return (
    <main className="">
      {selectedChatUser ? (
        <div className="chat-screen">
          <ChatScreen />
        </div>
      ) : (
        <NoChatScreen />
      )}
    </main>
  );
};

export default Chat;
