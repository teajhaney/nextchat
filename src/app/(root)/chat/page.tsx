'use client';

import { ChatScreen, NoChatScreen } from '@/components';

import { useEffect } from 'react';
import gsap from 'gsap';
import { useMessageStore } from '@/app/store/messageStore';

//

const Chat = () => {
  const { selectedChatUser } = useMessageStore(state => state);
  useEffect(() => {
    gsap.fromTo(
      '.chat-screen',
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.inOut' }
    );
  }, [selectedChatUser]);

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
