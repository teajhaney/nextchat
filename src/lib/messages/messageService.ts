'use server';

import { supabase } from '@/supabase/supabase';
import { supabaseServer } from '../../supabase/server';
import { Message } from '@/types/index';

//FETCH MESSAGES
export const fetchMessages = async (otherUserId: string): Promise<Message[]> => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user?.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

//SEND MESSAGES
export const sendMessage = async (recipientId: string, content: string): Promise<Message> => {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('No user');

  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: user.id, recipient_id: recipientId, content })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

//MARK MESSAGES AS READ
export const markMessagesAsRead = async (messageIds: string[]) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error };
  }
};

// export const markMessageAsRead = async (messageId: string) => {
//   return markMessagesAsRead([messageId]);
// };

// Mark all unread messages in a conversation as read
export const markConversationAsRead = async (otherUserId: string, currentUserId: string) => {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', currentUserId)
      .eq('is_read', false);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return { success: false, error };
  }
};
