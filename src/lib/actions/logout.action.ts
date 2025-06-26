'use server';
import { supabaseServer } from './../supabase/server';

import { redirect } from 'next/navigation';

export async function logoutUser() {
  const supabase = await supabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Revoke Google OAuth token if present
  if (session?.provider_token) {
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${session.provider_token}`,
      });
    } catch (error) {
      console.error('Error revoking Google token:', error);
    }
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Logout error:', error.message);
    throw error;
  }

  // Redirect to /logout to clear cookies in middleware
  return redirect('/logout');
}
