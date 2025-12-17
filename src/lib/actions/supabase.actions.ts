'use client';

import { supabaseBrowser } from '../supabase/browser';
// import { useAuthStore } from '@/app/store/authStore';

//google sign in
export const googleSignin = async () => {
  const supabase = supabaseBrowser();
  // Use window.location.origin to automatically get the correct domain (localhost or Vercel)
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    throw error;
  }
  if (data.url) {
    window.location.href = data.url; // Browser redirect for OAuth
  }
};

