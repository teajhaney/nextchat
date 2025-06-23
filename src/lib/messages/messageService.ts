'use server';

import { supabaseServer } from '../supabase/server';
import { Message } from '@/types/index';

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
