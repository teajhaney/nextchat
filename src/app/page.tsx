'use client';
import { LoadingSpinner, Button } from '@/components';
import { supabaseBrowser } from '@/supabase/browser';
import { MessageSquareDot } from 'lucide-react';

import Image from 'next/image';
// import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  //   const navigate = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  //google
  const handleGoogleSignIn = async () => {
    const supabase = supabaseBrowser();
    // Use window.location.origin for client-side redirects
    const redirectTo = `${window.location.origin}/auth/callback`;

    setIsGoogleLoading(true);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      setAuthError(error.message);
      setIsGoogleLoading(false);
    }
    if (data.url) {
      window.location.href = data.url; // Browser redirect for OAuth
    }
  };

  const errorStyles = 'text-red500 text-sm';
  return (
    <div className="font-lato center-col gap-5 h-screen text-primary ">
      {' '}
      <div className="flex gap-2 items-center font-bold text-2xl">
        {' '}
        <MessageSquareDot className="" />
        <h1>Nextchat</h1>
      </div>
      <div>
        {/* google sign button */}
        <Button
          className="self-center  border border-primary center  py-5 px-5  cursor-pointer gap-10 w-82"
          variant={'outline'}
          size={'lg'}
          onClick={() => handleGoogleSignIn()}
        >
          {' '}
          {isGoogleLoading ? (
            <LoadingSpinner className="border-primary h-6 w-6 border-dashed border-2" />
          ) : (
            <div className="center gap-10">
              {' '}
              <Image
                src="/images/google.svg"
                alt="google logo"
                width={24}
                height={24}
                className="h-auto w-auto"
              />
              <p className="text-primary font-medium max-md:text-sm text-xl">Sign in with Google</p>
            </div>
          )}
        </Button>
        {/* Display  errors */}
        {authError && <p className={errorStyles + ' text-center'}>{authError}</p>}
      </div>
    </div>
  );
}
