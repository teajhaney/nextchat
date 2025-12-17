'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseBrowser } from '../supabase/browser';

let unreadCountChannel: RealtimeChannel | null = null;
let unreadCountCallback: (() => void) | null = null;

export const subscribeToUnreadCounts = async (
  onUnreadCountChange: () => void
): Promise<RealtimeChannel | null> => {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user found for unread count subscription');
    return null;
  }

  // Store callback
  unreadCountCallback = onUnreadCountChange;

  // Unsubscribe from existing channel if it exists
  if (unreadCountChannel) {
    try {
      supabase.removeChannel(unreadCountChannel);
    } catch (error) {
      console.error('Error removing previous unread count channel:', error);
    }
    unreadCountChannel = null;
  }

  // Create channel for unread count updates
  unreadCountChannel = supabase.channel('unread-counts', {
    config: {
      broadcast: { self: true },
    },
  });

  // Listen for message inserts (new messages)
  unreadCountChannel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    },
    payload => {
      const newMessage = payload.new;
      // Only refresh if message is for current user
      if (newMessage.recipient_id === user.id) {
        console.log('New message received, refreshing unread counts');
        if (unreadCountCallback) {
          unreadCountCallback();
        }
      }
    }
  );

  // Listen for message updates (read receipts)
  unreadCountChannel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
    },
    payload => {
      const updatedMessage = payload.new;
      const oldMessage = payload.old;

      // Only refresh if message is for current user and is_read changed
      if (
        updatedMessage.recipient_id === user.id &&
        updatedMessage.is_read !== oldMessage.is_read
      ) {
        console.log('Message read status changed, refreshing unread counts');
        if (unreadCountCallback) {
          unreadCountCallback();
        }
      }
    }
  );

  // Subscribe to channel
  unreadCountChannel.subscribe(status => {
    if (status === 'SUBSCRIBED') {
      console.log('Successfully subscribed to unread count updates');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Unread count channel subscription error');
    } else if (status === 'TIMED_OUT') {
      console.error('Unread count channel subscription timed out');
    }
  });

  return unreadCountChannel;
};

export const unsubscribeFromUnreadCounts = () => {
  if (unreadCountChannel) {
    const supabase = supabaseBrowser();
    try {
      supabase.removeChannel(unreadCountChannel);
    } catch (error) {
      console.error('Error removing unread count channel:', error);
    }
    unreadCountChannel = null;
    unreadCountCallback = null;
  }
};
