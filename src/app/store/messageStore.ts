import { create } from 'zustand';
import { fetchMessages, sendMessage } from '@/lib/messages/messageService';
import { subscribeToMessages } from '@/lib/messages/messageSubscription';
import { Message, MessageState } from '@/types/index';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from './authStore';

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  selectedChatUser: null,
  isLoading: false,
  subscription: null,

  setSelectedChatUser: async user => {
    const { subscription, unsubscribeFromMessages } = get();

    set({
      isLoading: true,
      selectedChatUser: user,
      messages: [],
    });

    // Unsubscribe from previous chat
    if (subscription) {
      unsubscribeFromMessages();
    }

    // fetch fresh messages and subscribe
    get().fetchMessages(user.id);
    get().subscribeToMessages();
  },
  //fetch messages for the selected user
  fetchMessages: async otherUserId => {
    const { selectedChatUser } = get();

    // Ensure we're still on the same chat (prevent race conditions)
    if (!selectedChatUser || selectedChatUser.id !== otherUserId) {
      return;
    }

    try {
      const messages = await fetchMessages(otherUserId);

      if (selectedChatUser?.id === otherUserId) {
        set({ messages });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  //send message to the selected user
  sendMessage: async content => {
    const { selectedChatUser, messages } = get();
    if (!selectedChatUser) return;

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${uuidv4()}`, // Temporary ID
      sender_id: '', // Will be set when we get user
      recipient_id: selectedChatUser.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      isPending: true,
    };

    // Get current user ID
    const { user } = useAuthStore.getState(); // Import this
    if (user) {
      optimisticMessage.sender_id = user.id;
    }

    // Immediately added to UI
    const newMessage = [...messages, optimisticMessage];
    set({ messages: newMessage });

    try {
      const message = await sendMessage(selectedChatUser.id, content);

      // Replace optimistic message with real one
      const updatedMessages = newMessage.map(newMessage =>
        newMessage.id === optimisticMessage.id ? message : newMessage
      );

      set({ messages: updatedMessages });
    } catch (error) {
      // Remove optimistic message on failure, i.e set messages to evry other messages except the current message being sent
      const failedMessages = messages.filter(msg => msg.id !== optimisticMessage.id);
      set({ messages: failedMessages });
      console.error('Failed to send message:', error);
    }
  },

  //add message to the store
  addMessage: message => {
    const { messages, selectedChatUser } = get();
    if (!selectedChatUser) return;

    // Check if message already exists (avoid duplicates)
    const exists = messages.some(msg => msg.id === message.id);
    if (exists) return;

    // Check if this message belongs to current chat
    const isCurrentChat =
      message.sender_id === selectedChatUser.id || message.recipient_id === selectedChatUser.id;

    if (isCurrentChat) {
      const newMessages = [...messages, message];
      set({ messages: newMessages });
    }
  },

  //subscribe to messages for the selected user
  subscribeToMessages: () => {
    const { selectedChatUser, addMessage } = get();

    const subscription = subscribeToMessages(selectedChatUser.id, addMessage);
    set({ subscription }); // Optional: store subscription if needed for cleanup
  },

  //unsubscribe from messages
  unsubscribeFromMessages: async () => {
    const { subscription } = get();
    if (subscription) {
      supabase.channel(subscription).unsubscribe();
      set({ subscription: null });
    }
    // Optionally remove all channels if needed
    supabase.removeAllChannels();
  },
}));
