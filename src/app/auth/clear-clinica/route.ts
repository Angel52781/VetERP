import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { clinicaCookieName } from '@/lib/supabase/env';
import { buildRedirectUrl } from '@/lib/http/public-url';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(clinicaCookieName);

  return NextResponse.redirect(buildRedirectUrl(request, "/select-clinica"));
}
