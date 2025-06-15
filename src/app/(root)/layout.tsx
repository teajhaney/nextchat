import { Sidebar } from '@/components';
import React from 'react';

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
