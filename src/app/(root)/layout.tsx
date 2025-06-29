'use client';
import { Sidebar } from '@/components';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="text-textColor flex overflow-y-hidden">
      {' '}
      <div className='max-lg:w-full'>
        {' '}
        <Sidebar />
      </div>
      <div className="max-lg:hidden md:flex-1">{children}</div>
    </div>
  );
};
export default Layout;
