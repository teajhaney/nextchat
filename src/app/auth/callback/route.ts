import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    console.error('OAuth Error:', error, searchParams.get('error_description'));
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  if (code) {
    try {
      const supabase = await supabaseServer();
		const {  error } = await supabase.auth.exchangeCodeForSession(code);
	
      if (error) throw error;
      return NextResponse.redirect(`${origin}/chat`);
    
    } catch (error) {
      console.error('Code Exchange Error:', error);
      return NextResponse.redirect(`${origin}/?error=code_exchange_failed`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
