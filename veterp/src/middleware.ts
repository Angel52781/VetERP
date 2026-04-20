import { NextResponse, type NextRequest } from "next/server";

import { clinicaCookieName } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = new Set<string>(["/login"]);
const clinicPaths = ["/app", "/clientes", "/ajustes"];

function isClinicRequiredPath(pathname: string) {
  return clinicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  const isPublic = publicPaths.has(pathname);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    const clinicaId = request.cookies.get(clinicaCookieName)?.value;
    return NextResponse.redirect(
      new URL(clinicaId ? "/app" : "/select-clinica", request.url),
    );
  }

  if (user && pathname === "/select-clinica") {
    const clinicaId = request.cookies.get(clinicaCookieName)?.value;
    if (clinicaId) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  if (user && isClinicRequiredPath(pathname)) {
    const clinicaId = request.cookies.get(clinicaCookieName)?.value;
    if (!clinicaId) {
      return NextResponse.redirect(new URL("/select-clinica", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
