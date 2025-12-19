/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { FullScreenLoader } from '@/components';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const LOCAL_STORAGE_KEY = 'nextchat_auth';

  // On login page, render immediately without blocking
  const isLoginPage = pathname === '/';

  useEffect(() => {
    const supabase = supabaseBrowser();

    // On login page, skip auth check and render immediately
    if (isLoginPage) {
      setIsSessionChecked(true);
      setLoading(false);
      return;
    }

    // Always fetch fresh data from database on mount to ensure profile updates are reflected
    //  still use cached data for initial render but refresh immediately
    const cachedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cachedAuth) {
      const parsedData = JSON.parse(cachedAuth);
      setUser(parsedData.user);
      setUserData(parsedData.userData);
      setOtherUserData(parsedData.otherUserData || []);
      setLoading(false);
      setIsSessionChecked(true); // App is ready

      // Auto-load chat data when using cached auth
      if (typeof window !== 'undefined' && parsedData.user) {
        import('@/store/messageStore')
          .then(({ useMessageStore }) => {
            useMessageStore.getState().fetchChatData();
          })
          .catch(error => {
            console.error('Failed to load chat data from cache:', error);
          });
      }
    }

    const initializeSession = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user); //set authenticated user immediately

          // Fetch user profile and other users in parallel for faster loading
          const [userProfileResult, otherUsersResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single(),
            supabase.from('profiles').select('*').neq('id', session.user.id),
          ]);

          const userProfile = userProfileResult.data;
          const otherUsersProfile = otherUsersResult.data || [];

          if (userProfile) {
            setUserData(userProfile);
          }
          setOtherUserData(otherUsersProfile);

          const authData = {
            user: session.user,
            userData: userProfile,
            otherUserData: otherUsersProfile,
          };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(authData));

          // Auto-load chat data (lastMessages and unreadCounts) after login
          // Only run on client side
          if (typeof window !== 'undefined') {
            import('@/store/messageStore')
              .then(({ useMessageStore }) => {
                useMessageStore.getState().fetchChatData();
              })
              .catch(error => {
                console.error('Failed to load chat data after login:', error);
              });
          }
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

    // Always initialize session to fetch fresh data from database
    // This ensures profile updates (like avatar changes) are reflected
    initializeSession();

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
    isLoginPage,
    setUser,
    clearAuth,
    setLoading,
    setUserData,
    setOtherUserData,
    setAuthError,
  ]);

  // On login page, render immediately without blocking
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isSessionChecked) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
};
