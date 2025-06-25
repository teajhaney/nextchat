'use client';
import { Sidebar } from '@/components';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-textColor flex ">
      {' '}
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
};
export default Layout;
