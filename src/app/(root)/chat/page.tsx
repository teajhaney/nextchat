'use client';

import { useAuthStore } from '@/app/store/authStore';

const Chat = () => {
  const { user } = useAuthStore(state => state);

  return (
    <div>
      <p>ID: {user.id}</p>
      <p>Email: {user?.email}</p>
    </div>
  );
};

export default Chat;
