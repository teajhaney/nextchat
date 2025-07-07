'use client';
import { create } from 'zustand';
import { fetchMessages, sendMessage } from '@/lib/services/messageService';
import { subscribeToMessages } from '@/lib/services/messageSubscription';
import { Message, MessageState } from '@/types/index';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from './authStore';
import {
  clearOldMessages,
  getStoredMessages,
  STORAGE_KEY,
  storeMessages,
} from '@/lib/storage/localMessageStorage';
import { markMessagesAsRead } from '@/lib/services/readReceiptService';
import { fetchLastMessagesForAllChats } from '@/lib/services/lastMessageService';

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  selectedChatUser: null,
  isLoading: false,
  subscription: null,
  currentChatUserId: null,
  lastMessages: [],

  setSelectedChatUser: async otherUser => {
    const { subscription, unsubscribeFromMessages, currentChatUserId } = get();
    if (otherUser.id === currentChatUserId) return;
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    // Load cached messages immediately from local storage
    const cachedMessages = getStoredMessages(currentUser.id, otherUser.id);
    const { otherUserData } = useAuthStore.getState();
    const liveUser = otherUserData.find(u => u.id === otherUser.id);
    set({
      isLoading: cachedMessages.length === 0,
      selectedChatUser: liveUser || otherUser,
      currentChatUserId: otherUser.id,
      messages: cachedMessages,
    });
    // Unsubscribe from previous chat
    if (subscription) {
      unsubscribeFromMessages();
    }
    // fetch fresh messages and subscribe
    get().fetchMessages(otherUser.id);
    get().subscribeToMessages();
  },

  //FETCH messages for the selected user
  fetchMessages: async otherUserId => {
    const { selectedChatUser } = get();

    // Ensure we're still on the same chat (prevent race conditions)
    if (!selectedChatUser || selectedChatUser.id !== otherUserId) {
      return;
    }

    try {
      const serverMessages = await fetchMessages(otherUserId);
      // Double check if selected chat has not changed during async call
      const currentChatUser = get().selectedChatUser;
      if (currentChatUser?.id === otherUserId) {
        const currentMessages = get().messages;
        // Separate optimistic messages (those with temp IDs or isPending flag)
        const optimisticMessages = currentMessages.filter(
          msg => msg.id.startsWith('temp-') || msg.isPending
        );
        // Merge server messages with optimistic messages
        // Server messages come first, then optimistic messages at the end
        const mergedMessages = [...serverMessages, ...optimisticMessages];

        // Only update if we have different server messages
        const serverMessagesChanged =
          serverMessages.length !==
            currentMessages.length - optimisticMessages.length ||
          (serverMessages.length > 0 &&
            currentMessages.length > optimisticMessages.length &&
            serverMessages[serverMessages.length - 1].id !==
              currentMessages[
                currentMessages.length - optimisticMessages.length - 1
              ]?.id);
        if (serverMessagesChanged || optimisticMessages.length > 0) {
          set({ messages: mergedMessages, isLoading: false });

          // Store only the server messages in localStorage (not optimistic ones)
          const { user } = useAuthStore.getState();
          if (user) {
            storeMessages(user.id, otherUserId, serverMessages);
          }
        } else {
          set({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      set({ isLoading: false });
    }
  },

  //SEND message to the selected user
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
    const { user } = useAuthStore.getState();
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

      // Update localStorage with real message
      if (user) {
        storeMessages(user.id, selectedChatUser.id, updatedMessages);
      }
    } catch (error) {
      // Remove optimistic message on failure, i.e set messages to evry other messages except the current message being sent
      const failedMessages = messages.filter(
        msg => msg.id !== optimisticMessage.id
      );
      set({ messages: failedMessages });

      // Update localStorage to remove failed message
      if (user) {
        storeMessages(user.id, selectedChatUser.id, failedMessages);
      }

      console.error('Failed to send message:', error);
    }
  },

  //ADD message to the store
  addMessage: message => {
    const { messages, selectedChatUser, lastMessages } = get();
    if (!selectedChatUser) return;

    // Check if message already exists (avoid duplicates)
    const exists = messages.some(msg => msg.id === message.id);
    if (exists) return;

    // Check if this message belongs to current chat
    const { user } = useAuthStore.getState();
    const isCurrentChat =
      (message.sender_id === user.id &&
        message.recipient_id === selectedChatUser.id) ||
      (message.sender_id === selectedChatUser.id &&
        message.recipient_id === user.id);

    if (isCurrentChat) {
      const newMessages = [...messages, message];
      set({ messages: newMessages });

      // Update localStorage with new message
      if (user) {
        storeMessages(user.id, selectedChatUser.id, newMessages);
      }

      // Update last messages
      const updatedLastMessages = lastMessages.map(lastMsg => {
        if (lastMsg.otherUserId === selectedChatUser.id) {
          return { ...lastMsg, lastMessage: message };
        }
        return lastMsg;
      });
      set({ lastMessages: updatedLastMessages });
    }

    if (isCurrentChat) {
      const newMessages = [...messages, message];
      set({ messages: newMessages });

      // Update localStorage with new message
      if (user) {
        storeMessages(user.id, selectedChatUser.id, newMessages);
      }

      // Update last messages
      const updatedLastMessages = lastMessages.map(lastMsg => {
        if (lastMsg.otherUserId === selectedChatUser.id) {
          return { ...lastMsg, lastMessage: message };
        }
        return lastMsg;
      });
      set({ lastMessages: updatedLastMessages });
    }
  },

  //UPDATE message in the store
  updateMessage: (updatedMessage: Message) => {
    const { messages, selectedChatUser } = get();
    if (!selectedChatUser) return;

    // Check if this message belongs to current chat
    const { user } = useAuthStore.getState();
    const isCurrentChat =
      (updatedMessage.sender_id === user.id &&
        updatedMessage.recipient_id === selectedChatUser.id) ||
      (updatedMessage.sender_id === selectedChatUser.id &&
        updatedMessage.recipient_id === user.id);

    if (isCurrentChat) {
      // Find and update the specific message
      const updatedMessages = messages.map(msg =>
        msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
      );

      set({ messages: updatedMessages });

      // Update localStorage
      if (user) {
        storeMessages(user.id, selectedChatUser.id, updatedMessages);
      }
    }
  },

  //SUBSCRIBE to messages for the selected user
  subscribeToMessages: async () => {
    const { selectedChatUser, addMessage, updateMessage } = get();
    if (!selectedChatUser) return;
    const subscription = await subscribeToMessages(
      selectedChatUser?.id,
      addMessage,
      updateMessage // callback for message updates (read receipts)
    );
    set({ subscription });
  },

  //UNSUBSCRIBE from messages
  unsubscribeFromMessages: async () => {
    const { subscription } = get();
    if (subscription) {
      supabase.removeChannel(subscription);
      set({ subscription: null });
    }
    // Optionally remove all channels if needed
    // supabase.removeAllChannels();
  },

  // Add utility methods for cache management
  clearMessageCache: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  clearOldMessages: () => {
    clearOldMessages();
  },

  markMessagesAsRead: async (messageIds: string[]) => {
    const { messages, selectedChatUser } = get();
    if (!selectedChatUser || messageIds.length === 0) return;

    try {
      // Optimistically update UI - only update messages that are being marked as read
      const updatedMessages = messages.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
      );
      set({ messages: updatedMessages });

      // Update server
      await markMessagesAsRead(messageIds);

      // Update localStorage
      const { user } = useAuthStore.getState();
      if (user) {
        storeMessages(user.id, selectedChatUser.id, updatedMessages);
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      // Don't revert here - we'll get the correct state on next fetch
      get().fetchMessages(selectedChatUser.id);
    }
  },

  // Add new method to fetch last messages for all chats
  fetchLastMessagesForAllChats: async () => {
    try {
      const lastMessages = await fetchLastMessagesForAllChats();
      set({ lastMessages });
    } catch (error) {
      console.error('Failed to fetch last messages:', error);
    }
  },
}));

// Clean up old messages on app load
if (typeof window !== 'undefined') {
  clearOldMessages();
}
