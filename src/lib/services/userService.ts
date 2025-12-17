'use client';

import { supabaseBrowser } from '../supabase/browser';
import { UserData } from '@/types';

/**
 * Search for a user by email in the profiles table
 */
export const searchUserByEmail = async (
  email: string
): Promise<UserData | null> => {
  const supabase = supabaseBrowser();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};

/**
 * Fetch a user profile by user ID
 */
export const fetchUserById = async (userId: string): Promise<UserData | null> => {
  const supabase = supabaseBrowser();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};
