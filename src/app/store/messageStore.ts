'use client';
import { create } from 'zustand';
import {
  fetchMessages,
  markConversationAsRead,
  markMessagesAsRead,
  sendMessage,
} from '@/lib/messages/messageService';
import { subscribeToMessages } from '@/lib/messages/messageSubscription';
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

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  selectedChatUser: null,
  isLoading: false,
  subscription: null,
  currentChatUserId: null, //used for 1st fetch approach
  //   currentFetchId: null,

  setSelectedChatUser: async otherUser => {
    const { subscription, unsubscribeFromMessages, currentChatUserId } = get();
    if (otherUser.id === currentChatUserId) return;

    const { user: currentUser } = useAuthStore.getState();
    if (!currentUser) return;

    // Load cached messages immediately from local storage
    const cachedMessages = getStoredMessages(currentUser.id, otherUser.id);
    console.log(
      `Loading chat with ${otherUser.id}, found ${cachedMessages.length} cached messages`
    );

    set({
      isLoading: cachedMessages.length === 0,
      selectedChatUser: otherUser,
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
  //   fetchMessages: async otherUserId => {
  //     const { selectedChatUser } = get();

  //     // Ensure we're still on the same chat (prevent race conditions)
  //     if (!selectedChatUser || selectedChatUser.id !== otherUserId) {
  //       return;
  //     }

  //     try {
  //       const messages = await fetchMessages(otherUserId);

  //       // Double check if selected chat has not changed during async call
  //       const currentChatUser = get().selectedChatUser;

  //       if (currentChatUser?.id === otherUserId) {
  //         // Only update if we got newer messages or different count
  //         const currentMessages = get().messages;

  //         const shouldUpdate =
  //           messages.length !== currentMessages.length ||
  //           (messages.length > 0 &&
  //             currentMessages.length > 0 &&
  //             messages[messages.length - 1].id !== currentMessages[currentMessages.length - 1].id);

  //         if (shouldUpdate) {
  //           set({ messages, isLoading: false });

  //           // Store messages in localStorage
  //           const { user } = useAuthStore.getState();
  //           if (user) {
  //             storeMessages(user.id, otherUserId, messages);
  //           }
  //         } else {
  //           set({ isLoading: false });
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch messages:', error);
  //       set({ isLoading: false });
  //     }
  //   },
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
          serverMessages.length !== currentMessages.length - optimisticMessages.length ||
          (serverMessages.length > 0 &&
            currentMessages.length > optimisticMessages.length &&
            serverMessages[serverMessages.length - 1].id !==
              currentMessages[currentMessages.length - optimisticMessages.length - 1]?.id);

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
      const failedMessages = messages.filter(msg => msg.id !== optimisticMessage.id);
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
    if (!selectedChatUser) return;

    // Check if message already exists (avoid duplicates)
    const exists = messages.some(msg => msg.id === message.id);
    if (exists) return;

    // Check if this message belongs to current chat
    const { user } = useAuthStore.getState();
    const isCurrentChat =
      (message.sender_id === user.id && message.recipient_id === selectedChatUser.id) ||
      (message.sender_id === selectedChatUser.id && message.recipient_id === user.id);

    if (isCurrentChat) {
      const newMessages = [...messages, message];
      set({ messages: newMessages });

      // Update localStorage with new message
      if (user) {
        storeMessages(user.id, selectedChatUser.id, newMessages);
      }
    }
  },

  //SUBSCRIBE to messages for the selected user
  subscribeToMessages: async () => {
    const { selectedChatUser, addMessage } = get();

    const subscription = await subscribeToMessages(selectedChatUser.id, addMessage);
    set({ subscription }); // Optional: store subscription if needed for cleanup
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

  // Mark messages as read when user views them
  markMessagesAsRead: async (messageIds: string[]) => {
    const { messages, selectedChatUser } = get();
    if (!selectedChatUser || messageIds.length === 0) return;

    try {
      // Optimistically update UI
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
      // Revert optimistic update on failure
      get().fetchMessages(selectedChatUser.id);
    }
  },

  // Mark entire conversation as read (when user opens/focuses chat)
  markConversationAsRead: async () => {
    const { selectedChatUser, messages } = get();
    if (!selectedChatUser) return;

    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      // Find unread messages from the other user
      const unreadMessages = messages.filter(
        msg => msg.sender_id === selectedChatUser.id && msg.recipient_id === user.id && !msg.is_read
      );

      if (unreadMessages.length === 0) return;

      // Optimistically update UI
      const updatedMessages = messages.map(msg =>
        unreadMessages.some(unread => unread.id === msg.id) ? { ...msg, is_read: true } : msg
      );
      set({ messages: updatedMessages });

      // Update server
      await markConversationAsRead(selectedChatUser.id, user.id);

      // Update localStorage
      storeMessages(user.id, selectedChatUser.id, updatedMessages);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      // Revert on failure
      get().fetchMessages(selectedChatUser.id);
    }
  },
}));

// Clean up old messages on app load
if (typeof window !== 'undefined') {
  clearOldMessages();
}

// export const useMessageStore = create<MessageState>((set, get) => ({
//   messages: [],
//   selectedChatUser: null,
//   isLoading: false,
//   subscription: null,
//   currentChatUserId: null, //used for 1st fetch approach
//   currentFetchId: null,
//   setSelectedChatUser: async user => {
//     const { subscription, unsubscribeFromMessages } = get();
// 	if (user.id === get().currentChatUserId) return;
//     set({
//       isLoading: true,
//       selectedChatUser: user,
//       currentChatUserId: user.id,
//       messages: [],
//     });

//     // Unsubscribe from previous chat
//     if (subscription) {
//       unsubscribeFromMessages();
//     }

//     // fetch fresh messages and subscribe
//     get().fetchMessages(user.id);
//     get().subscribeToMessages();
//   },
//   //FETCH messages for the selected user
//   fetchMessages: async otherUserId => {
//     const { selectedChatUser } = get();

//     // Ensure we're still on the same chat (prevent race conditions)
//     if (!selectedChatUser || selectedChatUser.id !== otherUserId) {
//       return;
//     }

//     try {
//       const messages = await fetchMessages(otherUserId);

//       // Double check if selected chat has not changed during async call
//       const currentChatUser = get().selectedChatUser;
//       if (currentChatUser?.id === otherUserId) {
//         set({ messages, isLoading: false });
//       }
//     } catch (error) {
//       console.error('Failed to fetch messages:', error);
//     }
//   },

//   //SEND message to the selected user
//   sendMessage: async content => {
//     const { selectedChatUser, messages } = get();
//     if (!selectedChatUser) return;

//     // Create optimistic message
//     const optimisticMessage: Message = {
//       id: `temp-${uuidv4()}`, // Temporary ID
//       sender_id: '', // Will be set when we get user
//       recipient_id: selectedChatUser.id,
//       content,
//       created_at: new Date().toISOString(),
//       is_read: false,
//       isPending: true,
//     };

//     // Get current user ID
//     const { user } = useAuthStore.getState();
//     if (user) {
//       optimisticMessage.sender_id = user.id;
//     }

//     // Immediately added to UI
//     const newMessage = [...messages, optimisticMessage];
//     set({ messages: newMessage });

//     try {
//       const message = await sendMessage(selectedChatUser.id, content);

//       // Replace optimistic message with real one
//       const updatedMessages = newMessage.map(newMessage =>
//         newMessage.id === optimisticMessage.id ? message : newMessage
//       );

//       set({ messages: updatedMessages });
//     } catch (error) {
//       // Remove optimistic message on failure, i.e set messages to evry other messages except the current message being sent
//       const failedMessages = messages.filter(msg => msg.id !== optimisticMessage.id);
//       set({ messages: failedMessages });
//       console.error('Failed to send message:', error);
//     }
//   },

//   //ADD message to the store
//   addMessage: message => {
//     const { messages, selectedChatUser } = get();
//     if (!selectedChatUser) return;

//     // Check if message already exists (avoid duplicates)
//     const exists = messages.some(msg => msg.id === message.id);
//     if (exists) return;

//     // Check if this message belongs to current chat
//     const { user } = useAuthStore.getState();
//     const isCurrentChat =
//       (message.sender_id === user.id && message.recipient_id === selectedChatUser.id) ||
//       (message.sender_id === selectedChatUser.id && message.recipient_id === user.id);

//     if (isCurrentChat) {
//       const newMessages = [...messages, message];
//       set({ messages: newMessages });
//     }
//   },

//   //SUBSCRIBE to messages for the selected user
//   subscribeToMessages: async () => {
//     const { selectedChatUser, addMessage } = get();

//     const subscription = await subscribeToMessages(selectedChatUser.id, addMessage);
//     set({ subscription }); // Optional: store subscription if needed for cleanup
//   },

//   //UNSUBSCRIBE from messages
//   unsubscribeFromMessages: async () => {
//     const { subscription } = get();
//     if (subscription) {
//       supabase.removeChannel(subscription);
//       set({ subscription: null });
//     }
//     // Optionally remove all channels if needed
//     // supabase.removeAllChannels();
//   },
// }));

//fetch messages for the selected user-- another approach which gives each fech a unique id.
//   fetchMessages: async otherUserId => {
//     const { selectedChatUser } = get();

//     // Ensure we're still on the same chat (prevent race conditions)
//     if (!selectedChatUser || selectedChatUser.id !== otherUserId) {
//       return;
//     }

//     // If no fetchId provided, generate one (for backwards compatibility)

//     const fetchId = uuidv4();
//     set({ currentFetchId: fetchId });

//     try {
//       const messages = await fetchMessages(otherUserId);

//       // Double-check: only update if this is still the current fetch and current user
//       const currentState = get();
//       if (
//         currentState.selectedChatUser?.id === otherUserId &&
//         currentState.currentFetchId === fetchId
//       ) {
//         set({ messages, isLoading: false });
//       }
//       // If this is not the current fetch, just ignore the results
//     } catch (error) {
//       console.error('Failed to fetch messages:', error);
//       // Only update loading state if this is still the current fetch
//       const currentState = get();
//       if (currentState.currentFetchId === fetchId) {
//         set({ isLoading: false });
//       }
//     }
//   },
