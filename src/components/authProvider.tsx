'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { FullScreenLoader } from '@/components';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, clearAuth, setLoading, setUserData, setOtherUserData } = useAuthStore();
  const [isSessionChecked, setIsSessionChecked] = useState(false); // ✅ Track session check

  useEffect(() => {
    const supabase = supabaseBrowser();

    const initializeSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user); //set authenticated user

          //fetch user profile data
          const { data: userProfile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (!error && userProfile) {
            setUserData(userProfile); //set user data
          }

          // Fetch all other users except the current one
          const { data: otherUsersProfile, error: othersError } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', session.user.id);

          if (!othersError && otherUsersProfile) {
            // You can store this in Zustand store or local state
            setOtherUserData(otherUsersProfile);
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
        console.log(error);
      } finally {
        setLoading(false);
        setIsSessionChecked(true);
      }
    };

    initializeSession();

    //listening for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, clearAuth, setLoading, setUserData, setOtherUserData]);

  if (!isSessionChecked) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
};
