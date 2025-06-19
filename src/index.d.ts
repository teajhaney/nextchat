import { User } from '@/lib/supabase/supabase';

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

//message data which includes the user
declare interface MessageData {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
}
declare interface MessageState {
  selectedChatUser: MessageData | null;
  setSelectedChatUser: (user: MessageData) => void;
}
