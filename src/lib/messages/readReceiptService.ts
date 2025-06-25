'use client';
//MARK MESSAGES AS READ
// export const markMessagesAsRead = async (messageIds: string[]) => {
//   try {
//     const { error } = await supabase
//       .from('messages')
//       .update({ is_read: true })
//       .in('id', messageIds);

//     if (error) throw error;

//     return { success: true };
//   } catch (error) {
//     console.error('Error marking messages as read:', error);
//     return { success: false, error };
//   }
// };

// // Mark all unread messages in a conversation as read
// export const markConversationAsRead = async (otherUserId: string, currentUserId: string) => {
//   try {
//     const { error } = await supabase
//       .from('messages')
//       .update({ is_read: true })
//       .eq('sender_id', otherUserId)
//       .eq('recipient_id', currentUserId)
//       .eq('is_read', false);

//     if (error) throw error;

//     return { success: true };
//   } catch (error) {
//     console.error('Error marking conversation as read:', error);
//     return { success: false, error };
//   }
// };

import { supabaseBrowser } from '../../supabase/browser'; // Use browser client

//MARK MESSAGES AS READ (client-side to trigger real-time updates)
export const markMessagesAsRead = async (messageIds: string[]) => {
  try {
    const supabase = supabaseBrowser(); // Use browser client
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

// Mark all unread messages in a conversation as read
export const markConversationAsRead = async (otherUserId: string, currentUserId: string) => {
  try {
    const supabase = supabaseBrowser(); // Use browser client
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
