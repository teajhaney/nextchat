'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { supabaseBrowser } from '@/lib/supabase/browser';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, clearAuth, setLoading } = useAuthStore();
  const [isSessionChecked, setIsSessionChecked] = useState(false); // ✅ Track session check

  useEffect(() => {
    const supabase = supabaseBrowser();

    const initializeSession = async () => {
      setLoading(true); // ✅ Ensure loading is true
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
        console.log(error);
      } finally {
        setLoading(false); // ✅ Always clear loading
        setIsSessionChecked(true); // ✅ Mark session check complete
      }
    };

    initializeSession();

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
  }, [setUser, clearAuth, setLoading]);

  // ✅ Only render children when session is checked
  if (!isSessionChecked) {
    return null; // Or a loading spinner: <p>Loading...</p>
  }

  return <>{children}</>;
};
