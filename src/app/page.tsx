/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { LoadingSpinner, Button } from '@/components';
import { MessageSquareDot } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from './store/authStore';
import { googleSignin } from '@/lib/actions/supabase.actions';

// import { useAuthStore } from './store/authStore';
// import { useRouter } from 'next/navigation';

export default function Home() {
  const { authError, setLoading, loading, setAuthError,  } = useAuthStore(state => state);
  // const { user } = useAuthStore();

  //   const navigate = useRouter();
  //   // Redirect to /chat if already signed in
  //   useEffect(() => {
  //     if (user) {
  //       navigate.push('/chat');
  //     }
  //   }, [user, navigate]);

  //google
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      await googleSignin();
     
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
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
          {loading ? (
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
