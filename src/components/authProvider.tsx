'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { supabaseBrowser } from '@/lib/supabase/browser';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, clearAuth, setLoading, setUserData } = useAuthStore();
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
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (!error && profile) {
            setUserData(profile);
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
  }, [setUser, clearAuth, setLoading, setUserData]);

  if (!isSessionChecked) {
    return;
  }

  return <>{children}</>;
};
