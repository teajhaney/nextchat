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
export const fetchUserById = async (
  userId: string
): Promise<UserData | null> => {
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

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
): Promise<UserData | null> => {
  const supabase = supabaseBrowser();

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, full_name, email, avatar_url')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Upload avatar image to Supabase storage
 */
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  const supabase = supabaseBrowser();

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be logged in to upload an avatar');
  }

  if (user.id !== userId) {
    throw new Error('You can only upload avatars for your own profile');
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Note: Old avatars are not automatically deleted to preserve history
  // If you want to implement cleanup, you can add logic here

  // Upload file with user-specific path
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // Allow overwriting if file exists
    });

  if (uploadError) {
    // Provide more helpful error messages
    if (
      uploadError.message.includes('row-level security') ||
      uploadError.message.includes('RLS')
    ) {
      throw new Error(
        'Storage permission error. Please ensure the avatars bucket has proper RLS policies allowing authenticated users to upload.'
      );
    }
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return publicUrl;
};
