'use client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabaseBrowser } from '../supabase/browser';

export interface PresenceState {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

let presenceChannel: RealtimeChannel | null = null;
const presenceSubscriptionCallbacks: Map<string, (isOnline: boolean) => void> =
  new Map();

export const initializePresence = async () => {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Create presence channel if it doesn't exist
  if (!presenceChannel) {
    presenceChannel = supabase.channel('presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track current user's presence
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel?.presenceState();
      // Notify all callbacks
      if (state) {
        Object.keys(state).forEach(key => {
          const callback = presenceSubscriptionCallbacks.get(key);
          if (callback) {
            const userPresence = state[key];
            const isOnline =
              userPresence && Object.keys(userPresence).length > 0;
            callback(isOnline);
          }
        });
      }
    });

    presenceChannel.on('presence', { event: 'join' }, ({ key }) => {
      const callback = presenceSubscriptionCallbacks.get(key);
      if (callback) {
        callback(true);
      }
    });

    presenceChannel.on('presence', { event: 'leave' }, ({ key }) => {
      const callback = presenceSubscriptionCallbacks.get(key);
      if (callback) {
        callback(false);
      }
    });

    // Subscribe to channel
    presenceChannel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        // Track current user's online status
        await presenceChannel?.track({
          userId: user.id,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        });
      }
    });
  }

  return presenceChannel;
};

export const subscribeToPresence = (
  userId: string,
  onPresenceChange: (isOnline: boolean) => void
): RealtimeChannel | null => {
  // Initialize presence if not already done
  if (!presenceChannel) {
    initializePresence();
  }

  // Store callback for this user
  presenceSubscriptionCallbacks.set(userId, onPresenceChange);

  // Check current presence state
  if (presenceChannel) {
    const state = presenceChannel.presenceState();
    const userPresence = state[userId];
    const isOnline = userPresence && Object.keys(userPresence).length > 0;
    onPresenceChange(isOnline);
  }

  return presenceChannel;
};

export const unsubscribeFromPresence = (userId: string) => {
  presenceSubscriptionCallbacks.delete(userId);

  // If no more callbacks, clean up channel
  if (presenceSubscriptionCallbacks.size === 0 && presenceChannel) {
    const supabase = supabaseBrowser();
    supabase.removeChannel(presenceChannel);
    presenceChannel = null;
  }
};

export const updatePresence = async () => {
  const supabase = supabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !presenceChannel) return;

  await presenceChannel.track({
    userId: user.id,
    isOnline: true,
    lastSeen: new Date().toISOString(),
  });
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (presenceChannel) {
      const supabase = supabaseBrowser();
      supabase.removeChannel(presenceChannel);
      presenceChannel = null;
    }
  });
}
