
// import { useAuthStore } from '@/app/store/authStore';
import { supabase } from '../supabase/supabase';
import { supabaseBrowser } from '../supabase/browser';
import { useAuthStore } from '@/app/store/authStore';

//google sign in
export const googleSignin = async () => {
  const supabase = supabaseBrowser();
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
  }
  if (data.url) {
    window.location.href = data.url; // Browser redirect for OAuth
  }
};

export const logoutUser = async () => {
  try {
    // Sign out from Supabase

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error.message);
      return false;
    }

    // Clear auth store
    useAuthStore.getState().clearAuth();

    // Force redirect and reload to clear session
    window.location.href = '/';

    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
};





