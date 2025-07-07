import { User, RealtimeChannel } from '@/lib/supabase/supabase';

declare interface AuthState {
  user: User | null;
  loading: boolean;
  googleLoading: boolean;
  userData: UserData | null;
  otherUserData: UserData[];
  authError: string | null;
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
  setOtherUserData: (otherUserData: UserData[]) => void;
  setLoading: (loading: boolean) => void;
  setGoogleLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
  clearAuth: () => void;
}

declare interface UserData {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

//profile data which includes the user
declare interface ProfileData {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  //   is_online: boolean;
  //   last_seen: string;
}

declare interface MessageState {
  messages: Message[];
  isLoading: boolean;
  selectedChatUser: ProfileData | null;
  subscription: RealtimeChannel | null;
  currentChatUserId: string | null;
  lastMessages: LastMessage[];
  setSelectedChatUser: (user: ProfileData) => void;
  fetchMessages: (otherUserId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  updateMessage: (message: Message) => void;
  fetchLastMessagesForAllChats: () => Promise<void>;
  markMessagesAsRead: (messageIds: string[]) => Promise<void>;
  clearMessageCache: () => void;
  clearOldMessages: () => void;
}

// Tmessage data
declare interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  isPending?: boolean;
  isLoading?: boolean;
}

declare interface LastMessage {
  otherUserId: string;
  lastMessage: Message | null;
}
