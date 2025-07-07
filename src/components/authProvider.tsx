/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { FullScreenLoader } from '@/components';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    setUser,
    clearAuth,
    setLoading,
    setUserData,
    setOtherUserData,
    setAuthError,
  } = useAuthStore();
  const [isSessionChecked, setIsSessionChecked] = useState(false); // Track session check
  const LOCAL_STORAGE_KEY = 'nextchat_auth';

  useEffect(() => {
    const supabase = supabaseBrowser();

    //check local storage for session
    const cachedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cachedAuth) {
      const parsedData = JSON.parse(cachedAuth);
      setUser(parsedData.user);
      setUserData(parsedData.userData);
      setOtherUserData(parsedData.otherUserData || []);
      setLoading(false);
      setIsSessionChecked(true); // App is ready
    }

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

          const authData = {
            user: session.user,
            userData: userProfile,
            otherUserData: otherUsersProfile || [],
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authData));
        } else {
          clearAuth();
        }
      } catch (error: any) {
        clearAuth();
        setAuthError(error.message);
      } finally {
        setLoading(false);
        setIsSessionChecked(true);
      }
    };

    if (!cachedAuth) {
      initializeSession();
    }

    //listening for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [
    setUser,
    clearAuth,
    setLoading,
    setUserData,
    setOtherUserData,
    setAuthError,
  ]);

  if (!isSessionChecked) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
};
