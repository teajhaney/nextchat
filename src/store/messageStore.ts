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
import { fetchUnreadCountsForAllChats } from '@/lib/services/unreadCountService';
import { fetchChatDataForAllChats } from '@/lib/services/chatDataService';
import {
  subscribeToUnreadCounts,
  unsubscribeFromUnreadCounts,
} from '@/lib/services/unreadCountSubscription';

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  selectedChatUser: null,
  isLoading: false,
  subscription: null,
  currentChatUserId: null,
  lastMessages: [],
  unreadCounts: [],
  pendingReadReceipts: new Set<string>(),
  unreadCountSubscription: null,
  isChatDataLoading: false,

  setSelectedChatUser: otherUser => {
    const { subscription, unsubscribeFromMessages, currentChatUserId } = get();
    // Handle null case - clear selected chat
    if (!otherUser) {
      if (subscription) {
        unsubscribeFromMessages();
      }
      set({
        selectedChatUser: null,
        currentChatUserId: null,
        messages: [],
        isLoading: false,
      });
      return;
    }
    if (otherUser.id === currentChatUserId) return;
    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;
    // Unsubscribe from previous chat first
    if (subscription) {
      unsubscribeFromMessages();
    }

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

    // Mark all visible unread messages as read immediately
    const unreadMessages = cachedMessages.filter(
      msg =>
        msg.sender_id === otherUser.id &&
        msg.recipient_id === currentUser.id &&
        !msg.is_read
    );
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);
      // Don't await - let it happen in background
      get().markMessagesAsRead(messageIds);
    }

    // fetch fresh messages and subscribe (fire and forget)
    // Only run on client side
    if (typeof window !== 'undefined') {
      Promise.all([
        get().fetchMessages(otherUser.id),
        get().subscribeToMessages(),
      ]).catch(error => {
        console.error('Error in setSelectedChatUser async operations:', error);
      });
    }
  },

  //FETCH messages for the selected user
  fetchMessages: async otherUserId => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

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
      // Update lastMessages for this chat
      set(state => {
        const otherUserId = selectedChatUser.id;
        const updatedLastMessages = [
          ...state.lastMessages.filter(lm => lm.otherUserId !== otherUserId),
          { otherUserId, lastMessage: message },
        ];
        return { lastMessages: updatedLastMessages };
      });
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
    const { messages, selectedChatUser } = get();
    const { user } = useAuthStore.getState();

    if (!user) return;

    // Check if message already exists (avoid duplicates)
    const exists = messages.some(msg => msg.id === message.id);
    if (exists) return;

    // Check if this message belongs to current chat
    const isCurrentChat =
      selectedChatUser &&
      ((message.sender_id === user.id &&
        message.recipient_id === selectedChatUser.id) ||
        (message.sender_id === selectedChatUser.id &&
          message.recipient_id === user.id));

    if (isCurrentChat && selectedChatUser) {
      // Remove any optimistic message with same content and timestamp
      const filteredMessages = messages.filter(
        msg =>
          !(
            (
              msg.id.startsWith('temp-') &&
              msg.content === message.content &&
              Math.abs(
                new Date(msg.created_at).getTime() -
                  new Date(message.created_at).getTime()
              ) < 5000
            ) // Within 5 seconds
          )
      );

      const newMessages = [...filteredMessages, message];
      set({ messages: newMessages });

      // Update localStorage with new message
      storeMessages(user.id, selectedChatUser.id, newMessages);

      // Update last messages and unread counts together
      const otherUserId =
        message.sender_id === user.id
          ? message.recipient_id
          : message.sender_id;

      // Update lastMessages - move updated chat to top (most recent first)
      set(state => {
        const filtered = state.lastMessages.filter(
          lm => lm.otherUserId !== otherUserId
        );
        // Put the updated chat at the beginning (most recent)
        const updatedLastMessages = [
          { otherUserId, lastMessage: message },
          ...filtered,
        ];
        return { lastMessages: updatedLastMessages };
      });

      // Refresh unread counts when a new message is received (always update together)
      // Only if the message is from another user (not from current user)
      if (message.sender_id !== user.id) {
        get().fetchUnreadCounts();
      }
    } else {
      // Message is for a different chat - update last messages and unread counts together
      if (message.sender_id !== user.id) {
        const otherUserId = message.sender_id;
        // Update lastMessages - move updated chat to top (most recent first)
        set(state => {
          const filtered = state.lastMessages.filter(
            lm => lm.otherUserId !== otherUserId
          );
          // Put the updated chat at the beginning (most recent)
          const updatedLastMessages = [
            { otherUserId, lastMessage: message },
            ...filtered,
          ];
          return { lastMessages: updatedLastMessages };
        });
        // Then fetch unread counts (they update together)
        get().fetchUnreadCounts();
      } else {
        // Message sent by current user to another chat - still update lastMessages and move to top
        const otherUserId = message.recipient_id;
        set(state => {
          const filtered = state.lastMessages.filter(
            lm => lm.otherUserId !== otherUserId
          );
          // Put the updated chat at the beginning (most recent)
          const updatedLastMessages = [
            { otherUserId, lastMessage: message },
            ...filtered,
          ];
          return { lastMessages: updatedLastMessages };
        });
      }
    }
  },

  //UPDATE message in the store
  updateMessage: (updatedMessage: Message) => {
    const { messages, selectedChatUser } = get();
    const { user } = useAuthStore.getState();

    if (!user) return;

    const isCurrentChat =
      selectedChatUser &&
      ((updatedMessage.sender_id === user.id &&
        updatedMessage.recipient_id === selectedChatUser.id) ||
        (updatedMessage.sender_id === selectedChatUser.id &&
          updatedMessage.recipient_id === user.id));

    if (isCurrentChat && selectedChatUser) {
      // Find and update the specific message
      const updatedMessages = messages.map(msg => {
        // Handle optimistic message replacement with read receipt
        if (
          msg.id.startsWith('temp-') &&
          updatedMessage.content === msg.content &&
          Math.abs(
            new Date(msg.created_at).getTime() -
              new Date(updatedMessage.created_at).getTime()
          ) < 5000
        ) {
          return { ...updatedMessage, is_read: updatedMessage.is_read };
        }
        // Update existing message - ensure is_read is properly updated
        if (msg.id === updatedMessage.id) {
          return { ...msg, ...updatedMessage };
        }
        return msg;
      });

      set({ messages: updatedMessages });

      // Update localStorage
      storeMessages(user.id, selectedChatUser.id, updatedMessages);

      // Update lastMessages if the updated message is the last message
      const isLastMessage =
        updatedMessages[updatedMessages.length - 1]?.id === updatedMessage.id;
      if (isLastMessage) {
        const otherUserId =
          updatedMessage.sender_id === user.id
            ? updatedMessage.recipient_id
            : updatedMessage.sender_id;
        set(state => {
          const updatedLastMessages = state.lastMessages.map(lm =>
            lm.otherUserId === otherUserId
              ? { ...lm, lastMessage: updatedMessage }
              : lm
          );
          return { lastMessages: updatedLastMessages };
        });
      }

      // Refresh unread counts when read receipt is updated (update together)
      if (updatedMessage.is_read) {
        get().fetchUnreadCounts();
      }
    } else {
      // Update last messages for other chats if read receipt changed
      if (updatedMessage.is_read) {
        set(state => {
          const otherUserId =
            updatedMessage.sender_id === user.id
              ? updatedMessage.recipient_id
              : updatedMessage.sender_id;
          const existingLastMessage = state.lastMessages.find(
            lm => lm.otherUserId === otherUserId
          );
          if (existingLastMessage?.lastMessage?.id === updatedMessage.id) {
            const updatedLastMessages = state.lastMessages.map(lm =>
              lm.otherUserId === otherUserId
                ? { ...lm, lastMessage: updatedMessage }
                : lm
            );
            return { lastMessages: updatedLastMessages };
          }
          return state;
        });
        get().fetchUnreadCounts();
      }
    }
  },

  //SUBSCRIBE to messages for the selected user
  subscribeToMessages: async () => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const { selectedChatUser, addMessage, updateMessage, subscription } = get();
    if (!selectedChatUser) return;

    try {
      const newSubscription = await subscribeToMessages(
        selectedChatUser.id,
        addMessage,
        updateMessage, // callback for message updates (read receipts)
        subscription // pass existing channel for cleanup
      );
      if (newSubscription) {
        set({ subscription: newSubscription });
      }
    } catch (error) {
      console.error('Failed to subscribe to messages:', error);
    }
  },

  //UNSUBSCRIBE from messages
  unsubscribeFromMessages: () => {
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

  // Clear old messages from localStorage
  clearOldMessages: () => {
    clearOldMessages();
  },

  // MARK messages as read
  markMessagesAsRead: async (messageIds: string[]) => {
    const { messages, selectedChatUser } = get();
    if (!selectedChatUser || messageIds.length === 0) return;

    try {
      // Filter to only messages that are actually unread
      const messagesToMark = messages.filter(
        msg => messageIds.includes(msg.id) && !msg.is_read
      );

      if (messagesToMark.length === 0) return;

      const idsToMark = messagesToMark.map(msg => msg.id);

      // Optimistically update UI immediately
      const updatedMessages = messages.map(msg =>
        idsToMark.includes(msg.id) ? { ...msg, is_read: true } : msg
      );
      set({ messages: updatedMessages });

      // Update server
      await markMessagesAsRead(idsToMark);

      // Update localStorage
      const { user } = useAuthStore.getState();
      if (user) {
        storeMessages(user.id, selectedChatUser.id, updatedMessages);
      }

      // Update lastMessages if the last message was just marked as read
      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (lastMessage && idsToMark.includes(lastMessage.id)) {
        const otherUserId =
          lastMessage.sender_id === user?.id
            ? lastMessage.recipient_id
            : lastMessage.sender_id;
        set(state => {
          const updatedLastMessages = state.lastMessages.map(lm =>
            lm.otherUserId === otherUserId
              ? { ...lm, lastMessage: lastMessage }
              : lm
          );
          return { lastMessages: updatedLastMessages };
        });
      }

      // Refresh unread counts immediately after marking messages as read (update together)
      get().fetchUnreadCounts();
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      // Revert optimistic update on error
      const { messages: currentMessages } = get();
      const revertedMessages = currentMessages.map(msg =>
        messageIds.includes(msg.id) ? { ...msg, is_read: false } : msg
      );
      set({ messages: revertedMessages });
    }
  },

  // Optimized: Fetch both last messages and unread counts together (single database call)
  // Returns data sorted by last message timestamp (most recent first)
  fetchChatData: async () => {
    // Set loading state to prevent showing "no message yet" flash
    set({ isChatDataLoading: true });
    try {
      const { lastMessages, unreadCounts } = await fetchChatDataForAllChats();
      // Data is already sorted by chatDataService, just set it
      set({ lastMessages, unreadCounts, isChatDataLoading: false });
    } catch (error) {
      console.error('Failed to fetch chat data:', error);
      set({ isChatDataLoading: false });
    }
  },

  // Add new method to fetch last messages for all chats (kept for backward compatibility)
  fetchLastMessagesForAllChats: async () => {
    try {
      const lastMessages = await fetchLastMessagesForAllChats();
      set({ lastMessages });
    } catch (error) {
      console.error('Failed to fetch last messages:', error);
    }
  },

  // Fetch unread message counts for all chats (kept for backward compatibility)
  fetchUnreadCounts: async () => {
    try {
      const unreadCounts = await fetchUnreadCountsForAllChats();
      set({ unreadCounts });
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  },

  // Subscribe to unread count changes
  subscribeToUnreadCounts: async () => {
    // Ensure we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const { unreadCountSubscription } = get();

    // Unsubscribe from existing subscription if any
    if (unreadCountSubscription) {
      unsubscribeFromUnreadCounts();
    }

    // Subscribe to unread count changes
    const subscription = await subscribeToUnreadCounts(() => {
      // Refresh unread counts and last messages together (optimized: single call)
      get().fetchChatData();
    });

    if (subscription) {
      set({ unreadCountSubscription: subscription });
    }
  },

  // Unsubscribe from unread count changes
  unsubscribeFromUnreadCounts: () => {
    unsubscribeFromUnreadCounts();
    set({ unreadCountSubscription: null });
  },
}));

// Clean up old messages on app load
if (typeof window !== 'undefined') {
  clearOldMessages();
}
