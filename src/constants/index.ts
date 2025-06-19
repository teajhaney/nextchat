import { MessageCircle, Settings } from 'lucide-react';

export const sidebarItems = [
  {
    title: 'Chats',
    icon: MessageCircle,
  },
  {
    title: 'Settings',
    icon: Settings,
  },
];


  // Fallback avatar if userData or avatar_url is missing
  export const avatarUrl = '/images/google.svg'; // Add a default image in public folder
