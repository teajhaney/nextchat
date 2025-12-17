'use server';

import { supabaseServer } from '../supabase/server';

export interface UnreadCount {
  otherUserId: string;
  count: number;
}

export const fetchUnreadCountsForAllChats = async (): Promise<
  UnreadCount[]
> => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No user');

  // Optimized: Single query to get all unread messages, then group by sender
  const { data: unreadMessages, error } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('recipient_id', user.id)
    .eq('is_read', false);

  if (error) throw new Error(error.message);

  if (!unreadMessages || unreadMessages.length === 0) {
    return [];
  }

  // Group by sender_id and count
  const countMap = new Map<string, number>();
  for (const msg of unreadMessages) {
    const currentCount = countMap.get(msg.sender_id) || 0;
    countMap.set(msg.sender_id, currentCount + 1);
  }

  // Convert map to array format
  const unreadCounts: UnreadCount[] = Array.from(countMap.entries()).map(
    ([otherUserId, count]) => ({
      otherUserId,
      count,
    })
  );

  return unreadCounts;
};
