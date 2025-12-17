'use server';

import { supabaseServer } from '../supabase/server';
import { Message } from '@/types/index';

export interface LastMessage {
  otherUserId: string;
  lastMessage: Message | null;
}

export interface UnreadCount {
  otherUserId: string;
  count: number;
}

export interface ChatData {
  lastMessages: LastMessage[];
  unreadCounts: UnreadCount[];
}

/**
 * Optimized: Fetch both last messages and unread counts in a single database round trip
 * This is much faster than making separate calls
 */
export const fetchChatDataForAllChats = async (): Promise<ChatData> => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No user');

  // Fetch all messages and unread messages in parallel
  const [allMessagesResult, unreadMessagesResult] = await Promise.all([
    supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('sender_id')
      .eq('recipient_id', user.id)
      .eq('is_read', false),
  ]);

  if (allMessagesResult.error) throw new Error(allMessagesResult.error.message);
  if (unreadMessagesResult.error)
    throw new Error(unreadMessagesResult.error.message);

  const allMessages = allMessagesResult.data || [];
  const unreadMessages = unreadMessagesResult.data || [];

  // Process last messages
  const lastMessagesMap = new Map<string, Message>();
  for (const message of allMessages) {
    const otherUserId =
      message.sender_id === user.id ? message.recipient_id : message.sender_id;

    if (!lastMessagesMap.has(otherUserId)) {
      lastMessagesMap.set(otherUserId, message);
    }
  }

  // Convert to array and sort by timestamp (most recent first)
  const lastMessages: LastMessage[] = Array.from(lastMessagesMap.entries())
    .map(([otherUserId, lastMessage]) => ({
      otherUserId,
      lastMessage,
    }))
    .sort((a, b) => {
      // Sort by last message timestamp (most recent first)
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
      );
    });

  // Process unread counts
  const countMap = new Map<string, number>();
  for (const msg of unreadMessages) {
    const currentCount = countMap.get(msg.sender_id) || 0;
    countMap.set(msg.sender_id, currentCount + 1);
  }

  const unreadCounts: UnreadCount[] = Array.from(countMap.entries()).map(
    ([otherUserId, count]) => ({
      otherUserId,
      count,
    })
  );

  return { lastMessages, unreadCounts };
};
