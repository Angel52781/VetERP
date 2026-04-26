import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clinicaCookieName } from '@/lib/supabase/env';

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);

  return NextResponse.redirect(`${origin}/select-clinica`);
}
