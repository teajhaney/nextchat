import {  MessageState } from '@/index';
import { create } from 'zustand';

export const useMessageStore = create<MessageState>(set => ({
  selectedChatUser: null,
  setSelectedChatUser: (user) => set({ selectedChatUser: user }),
}));
