/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { LoadingSpinner, Button } from '@/components';
import { MessageSquareDot } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export default function Home() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);

  //google
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      navigate.push('/');
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsGoogleLoading(false);
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
          className="self-center  border border-primary center  py-5 px-5  cursor-pointer gap-10 w-full"
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
