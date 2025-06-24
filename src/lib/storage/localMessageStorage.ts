import { Message } from '@/types';

export const STORAGE_KEY = 'message-cache';

export const getStoredMessages = (userID: string, otherUserID: string): Message[] => {
  if (typeof window === 'undefined') return []; // SSR safety

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    const chatKey = getChatKey(userID, otherUserID);
    const messages = data[chatKey] || [];
    console.log('Retrieved messages for', chatKey, ':', messages, 'messages');
    return messages;
  } catch (error) {
    console.error('Failed to get stored messages:', error);
    return [];
  }
};

export const storeMessages = (userID: string, otherUserID: string, messages: Message[]) => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    const chatKey = getChatKey(userID, otherUserID);

    // Limit messages to prevent localStorage bloat
    const messagesToStore = messages.length > 1000 ? messages.slice(-1000) : messages;
    data[chatKey] = messagesToStore;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Add this to your localStorage functions
	console.log('Stored', messagesToStore.length, 'messages for', chatKey);
  } catch (error) {
    console.error('Failed to store messages:', error);
  }
};

const getChatKey = (userID: string, otherUserID: string): string => {
  return [userID, otherUserID].sort().join('-');
};

// export const shouldFetchFreshMessages = (cachedMessages: Message[]): boolean => {
//   if (cachedMessages.length === 0) return true; // No cache, fetch fresh

//   const lastMessage = cachedMessages[cachedMessages.length - 1];
//   const lastMessageTime = new Date(lastMessage.created_at);
//   const now = new Date();

//   // Fetch fresh if last message is older than 5 minutes
//   const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
//   return lastMessageTime < fiveMinutesAgo;
// };

export const clearOldMessages = () => {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data = JSON.parse(stored);
    const currentTime = Date.now();
    const oneWeekAgo = currentTime - 7 * 24 * 60 * 60 * 1000;

    for (const key in data) {
      data[key] = data[key].filter((message: Message) => {
        return new Date(message.created_at).getTime() >= oneWeekAgo;
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error cleaning localStorage:', error);
  }
};
