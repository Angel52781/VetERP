import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildRedirectUrl } from '@/lib/http/public-url';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(buildRedirectUrl(request, next));
    }
  }

  // Handle errors by redirecting to /login
  return NextResponse.redirect(buildRedirectUrl(request, "/login"));
}
