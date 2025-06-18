import { supabaseBrowser } from '../supabase/browser';

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
