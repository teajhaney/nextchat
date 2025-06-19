'use client';

import { useAuthStore } from '@/app/store/authStore';

const Chat = () => {
  const { user, userData } = useAuthStore(state => state);

  return (
    <div>
      <p>ID: {user.id}</p>
      <p>Email: {user?.email}</p>
      <p> {userData?.id}</p>
      <p> {userData?.full_name}</p>
      <p> {userData?.avatar_url}</p>
      <p> {userData?.email}</p>
    </div>
  );
};

export default Chat;
