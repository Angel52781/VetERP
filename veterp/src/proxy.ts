import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clinicaCookieName, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = new Set<string>([
  "/login",
  "/reset-password",
  "/update-password",
  "/auth/callback",
]);

async function getUserClinicas(request: NextRequest, response: NextResponse, userId: string) {
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase
    .from("user_clinicas")
    .select("clinica_id")
    .eq("user_id", userId);

  return data ?? [];
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/signup") {
    if (user) {
      return NextResponse.redirect(new URL("/select-clinica", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!user) {
    if (!publicPaths.has(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  if (pathname === "/auth/callback") {
    return response;
  }

  const memberships = await getUserClinicas(request, response, user.id);
  const clinicaId = request.cookies.get(clinicaCookieName)?.value;
  const hasMemberships = memberships.length > 0;
  const activeClinicaId = memberships.some((m) => m.clinica_id === clinicaId)
    ? clinicaId
    : null;

  if (!activeClinicaId && clinicaId) {
    response.cookies.delete(clinicaCookieName);
  }

  if (!hasMemberships) {
    if (pathname !== "/select-clinica") {
      return NextResponse.redirect(new URL("/select-clinica", request.url));
    }
    return response;
  }

  if (!activeClinicaId) {
    if (pathname !== "/select-clinica") {
      return NextResponse.redirect(new URL("/select-clinica", request.url));
    }
    return response;
  }

  if (
    pathname === "/select-clinica" ||
    pathname === "/login" ||
    pathname === "/reset-password" ||
    pathname === "/update-password"
  ) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
