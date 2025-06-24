import { User, RealtimeChannel } from '@/supabase/supabase';

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
}

declare interface MessageState {
  messages: Message[];
  isLoading: boolean;
  selectedChatUser: Profile | null;
  subscription: RealtimeChannel | null;
  currentChatUserId: string | null;
  //   currentFetchId: string | null;
  setSelectedChatUser: (user: Profile) => void;
  fetchMessages: (otherUserId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: Message) => void;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  // markConversationAsRead: (otherUserId: string) => Promise<void>;
  //   markMessageAsRead: (messageId: string) => void;

  //  cache management methods
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
