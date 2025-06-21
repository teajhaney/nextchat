

import { create } from 'zustand';
import { fetchMessages, sendMessage } from '@/lib/messages/messageService';
import { subscribeToMessages } from '@/lib/messages/messageSubscription';
import { MessageState } from '@/index';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  selectedChatUser: null,

  subscription: null,

  setSelectedChatUser: user => set({ selectedChatUser: user }),
  //fetch messages for the selected user
  fetchMessages: async otherUserId => {
    try {
      const messages = await fetchMessages(otherUserId);
      set({ messages });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  },

  //send message to the selected user
  sendMessage: async content => {
    const { selectedChatUser } = get();
    if (!selectedChatUser) return;

    // Optimistic message logic
    const optimisticMessage = {
      id: uuidv4(),
      sender_id: (await supabase.auth.getUser()).data.user?.id || '',
      recipient_id: selectedChatUser.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      isPending: true,
    };
    set(state => ({ messages: [...state.messages, optimisticMessage] }));

    try {
      const confirmedMessage = await sendMessage(selectedChatUser.id, content);
      set(state => ({
        messages: state.messages.map(msg =>
          msg.id === optimisticMessage.id ? confirmedMessage : msg
        ),
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },

  //add message to the store
  addMessage: message => set(state => ({ messages: [...state.messages, message] })),

  //subscribe to messages for the selected user
  subscribeToMessages: () => {
    const { selectedChatUser, addMessage } = get();

    const subscription = subscribeToMessages(selectedChatUser.id, addMessage);
    set({ subscription }); // Optional: store subscription if needed for cleanup
  },

  //unsubscribe from messages
  unsubscribeFromMessages: () => {
    const { subscription } = get();
    if (subscription) {
      supabase.channel(subscription).unsubscribe();
      set({ subscription: null });
    }
    // Optionally remove all channels if needed
    supabase.removeAllChannels();
  },
}));
