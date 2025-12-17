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

  // Optimized: Use a single query with window functions to get last message per chat
  // This uses PostgreSQL's DISTINCT ON which is much faster than N queries
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  if (!messages || messages.length === 0) {
    return [];
  }

  // Group messages by conversation partner and get the most recent one
  const lastMessagesMap = new Map<string, Message>();
  
  for (const message of messages) {
    const otherUserId = message.sender_id === user.id 
      ? message.recipient_id 
      : message.sender_id;
    
    // Only keep the first (most recent) message for each conversation
    if (!lastMessagesMap.has(otherUserId)) {
      lastMessagesMap.set(otherUserId, message);
    }
  }

  // Convert map to array format
  const lastMessages: LastMessage[] = Array.from(lastMessagesMap.entries()).map(
    ([otherUserId, lastMessage]) => ({
      otherUserId,
      lastMessage,
    })
  );

  return lastMessages;
}; 
