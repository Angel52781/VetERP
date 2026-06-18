import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { clinicaCookieName } from '@/lib/supabase/env';
import { getPublicBaseUrl } from '@/lib/http/public-url';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error("Supabase signout error:", e);
  }

  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);

  return NextResponse.redirect(`${getPublicBaseUrl(request)}/login`);
}
