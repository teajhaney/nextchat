'use client';
import { Sidebar } from '@/components';
import { useMessageStore } from '@/store/messageStore';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { selectedChatUser } = useMessageStore(state => state);

  return (
    <div className="text-textColor flex overflow-y-hidden relative">
      {/* Sidebar - always visible on large screens, hidden when chat is selected on small screens */}
      <div className={selectedChatUser ? 'max-lg:hidden lg:block' : 'w-full'}>
        <Sidebar />
      </div>

      {/* Chat Content - slides over sidebar on small screens when chat is selected */}
      {selectedChatUser ? (
        <div className="lg:flex-1  max-lg:inset-0 max-lg:z-10 max-lg:w-full">
          {children}
        </div>
      ) : (
        <div className="max-lg:hidden lg:flex-1">{children}</div>
      )}
    </div>
  );
};
export default Layout;
