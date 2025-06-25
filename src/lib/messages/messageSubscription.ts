// 'use client';
// import { RealtimeChannel } from '@supabase/supabase-js';
// import { Message } from '@/types/index';
// import { supabaseBrowser } from '../../supabase/browser';

// let channel: RealtimeChannel | null = null;

// export const subscribeToMessages = async (
//   otherUserId: string,
//   callback: (message: Message) => void
// ): Promise<RealtimeChannel | null> => {
//   const supabase = supabaseBrowser();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) return null;

//   // Unsubscribe if a channel already exists
//   if (channel) {
//     await supabase.removeChannel(channel);
//     channel = null;
//   }

//   channel = supabase.channel(`messages:${user.id}:${otherUserId}`);

//   channel
//     .on(
//       'postgres_changes',
//       {
//         event: 'INSERT',
//         schema: 'public',
//         table: 'messages',
//       },
//       payload => {
//         const newMessage = payload.new as Message;
//         const isParticipant =
//           (newMessage.sender_id === user.id && newMessage.recipient_id === otherUserId) ||
//           (newMessage.sender_id === otherUserId && newMessage.recipient_id === user.id);

//         if (isParticipant) {
//           callback(newMessage);
//         }
//       }
//     )
//     .subscribe();

//   return channel;
// };


'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Message } from '@/types/index';
import { supabaseBrowser } from '../../supabase/browser';

let channel: RealtimeChannel | null = null;

export const subscribeToMessages = async (
  otherUserId: string,
  onNewMessage: (message: Message) => void,
  onMessageUpdate: (message: Message) => void // Add callback for updates
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
      const isParticipant =
        (newMessage.sender_id === user.id && newMessage.recipient_id === otherUserId) ||
        (newMessage.sender_id === otherUserId && newMessage.recipient_id === user.id);

      if (isParticipant) {
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
      const isParticipant =
        (updatedMessage.sender_id === user.id && updatedMessage.recipient_id === otherUserId) ||
        (updatedMessage.sender_id === otherUserId && updatedMessage.recipient_id === user.id);

      if (isParticipant) {
        onMessageUpdate(updatedMessage);
      }
    }
  );

  channel.subscribe();

  return channel;
};




