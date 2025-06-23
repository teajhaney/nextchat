'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Message } from '@/types/index';
import { supabaseBrowser } from '../supabase/browser';

let channel: RealtimeChannel | null = null;

export const subscribeToMessages = async (
  otherUserId: string,
  callback: (message: Message) => void
): Promise<RealtimeChannel | null> => {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Unsubscribe if a channel already exists
  if (channel) {
    await supabase.removeChannel(channel);
    channel = null;
  }

  channel = supabase.channel(`messages:${user.id}:${otherUserId}`);

  channel 
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      payload => {
        const newMessage = payload.new as Message;
        const isParticipant =
          (newMessage.sender_id === user.id && newMessage.recipient_id === otherUserId) ||
          (newMessage.sender_id === otherUserId && newMessage.recipient_id === user.id);

        if (isParticipant) {
          callback(newMessage);
        }
      }
    )
    .subscribe();

  return channel;
};
