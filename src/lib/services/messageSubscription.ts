'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Message } from '@/types/index';
import { supabaseBrowser } from '../supabase/browser';

export const subscribeToMessages = async (
  otherUserId: string,
  onNewMessage: (message: Message) => void,
  onMessageUpdate: (message: Message) => void,
  existingChannel: RealtimeChannel | null = null
): Promise<RealtimeChannel | null> => {
  // Ensure we're in a browser environment
  if (typeof window === 'undefined') {
    console.error('subscribeToMessages can only be called on the client side');
    return null;
  }

  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user found for subscription');
    return null;
  }

  // Unsubscribe from existing channel if provided
  if (existingChannel) {
    try {
      await supabase.removeChannel(existingChannel);
    } catch (error) {
      console.error('Error removing previous channel:', error);
    }
  }

  // Create a unique channel name for this conversation
  // Sort IDs to ensure consistent channel name regardless of who initiates
  const channelName = `messages:${[user.id, otherUserId].sort().join(':')}`;
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: true },
      presence: { key: user.id },
    },
  });

  // Listen for new messages (INSERT)
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    },
    payload => {
      const newMessage = payload.new as Message;
      // Filter to only messages in this conversation
      const isParticipant =
        (newMessage.sender_id === user.id &&
          newMessage.recipient_id === otherUserId) ||
        (newMessage.sender_id === otherUserId &&
          newMessage.recipient_id === user.id);

      if (isParticipant) {
        console.log('New message received via Realtime:', newMessage);
        onNewMessage(newMessage);
      }
    }
  );

  // Listen for message updates (UPDATE) - for read receipts
  channel.on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
    },
    payload => {
      const updatedMessage = payload.new as Message;
      const oldMessage = payload.old as Message;

      // Only process if is_read changed
      if (updatedMessage.is_read !== oldMessage.is_read) {
        // Filter to only messages in this conversation
        const isParticipant =
          (updatedMessage.sender_id === user.id &&
            updatedMessage.recipient_id === otherUserId) ||
          (updatedMessage.sender_id === otherUserId &&
            updatedMessage.recipient_id === user.id);

        if (isParticipant) {
          console.log('Message updated via Realtime:', updatedMessage);
          onMessageUpdate(updatedMessage);
        }
      }
    }
  );

  // Subscribe to channel
  channel.subscribe(status => {
    if (status === 'SUBSCRIBED') {
      console.log(`Successfully subscribed to channel: ${channelName}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Channel subscription error');
    } else if (status === 'TIMED_OUT') {
      console.error('Channel subscription timed out');
    } else if (status === 'CLOSED') {
      console.log('Channel closed');
    }
  });

  return channel;
};
