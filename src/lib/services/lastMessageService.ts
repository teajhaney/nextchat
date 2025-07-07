'use server';

import { supabaseServer } from '../supabase/server';
import { Message } from '@/types/index';

export interface LastMessage {
  otherUserId: string;
  lastMessage: Message | null;
}

export const fetchLastMessagesForAllChats = async (): Promise<LastMessage[]> => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No user');

  // Get all unique chat participants
  const { data: participants, error: participantsError } = await supabase
    .from('messages')
    .select('sender_id, recipient_id')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

  if (participantsError) throw new Error(participantsError.message);

  // Get unique user IDs (excluding current user)
  const uniqueUserIds = new Set<string>();
  participants?.forEach(msg => {
    if (msg.sender_id !== user.id) uniqueUserIds.add(msg.sender_id);
    if (msg.recipient_id !== user.id) uniqueUserIds.add(msg.recipient_id);
  });

  const lastMessages: LastMessage[] = [];

  // Fetch last message for each chat
  for (const otherUserId of uniqueUserIds) {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Error fetching last message for user ${otherUserId}:`, error);
      lastMessages.push({ otherUserId, lastMessage: null });
    } else {
      lastMessages.push({ otherUserId, lastMessage: messages?.[0] || null });
    }
  }

  return lastMessages;
}; 
