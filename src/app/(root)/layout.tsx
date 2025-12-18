'use client';
import { Sidebar } from '@/components';
import { useMessageStore } from '@/store/messageStore';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { selectedChatUser } = useMessageStore(state => state);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatContentRef.current) return;

    if (selectedChatUser) {
      gsap.fromTo(
        chatContentRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        }
      );
    } else {
      gsap.to(chatContentRef.current, {
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
      });
    }
  }, [selectedChatUser]);

  return (
    <div className="text-textColor flex h-screen max-lg:h-[100dvh] w-full overflow-hidden relative">
      {/* Sidebar - always visible on large screens, hidden when chat is selected on small screens */}
      <div
        ref={sidebarRef}
        className={
          selectedChatUser
            ? 'max-lg:hidden lg:block flex-shrink-0'
            : 'max-lg:w-full flex-shrink-0'
        }
      >
        <Sidebar />
      </div>

      {/* Chat Content - slides over sidebar on small screens when chat is selected */}
      {selectedChatUser ? (
        <div
          ref={chatContentRef}
          className="lg:flex-1 max-lg:inset-0 max-lg:z-10 max-lg:w-full min-w-0 overflow-hidden"
        >
          {children}
        </div>
      ) : (
        <div className="max-lg:hidden lg:flex-1 lg:flex lg:items-center lg:justify-center min-w-0">
          {children}
        </div>
      )}
    </div>
  );
};
export default Layout;
