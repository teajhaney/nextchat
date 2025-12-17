import {
  MessageCircle,
  Settings,
  Search,
  //   Video,
  //   Phone,
  Info,
  EllipsisVertical,
  //   SmilePlus,
  //   Folder,
} from 'lucide-react';

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

//chat options

export const chatOptions = [
  { icon: Search, title: 'Search' },
  //   { icon: Video, title: 'Video call' },
  //   { icon: Phone, title: 'Phone call' },
  { icon: Info, title: 'Contact info' },
  { icon: EllipsisVertical, title: 'Menu' },
];
export const messageInputOptions = [
  //   { icon: SmilePlus, title: 'Emoji' },
  //   { icon: Folder, title: 'File' },
  { icon: EllipsisVertical, title: 'Menu' },
];
