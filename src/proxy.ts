import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { assertSupabaseEnv, clinicaCookieName, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";
import { buildRedirectUrl } from "@/lib/http/public-url";

const publicPaths = new Set<string>([
  "/",
  "/login",
  "/reset-password",
  "/update-password",
  "/auth/callback",
  "/privacidad",
  "/terminos",
]);

async function getUserClinicas(request: NextRequest, response: NextResponse, userId: string) {
  assertSupabaseEnv();
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

function safeRedirect(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(buildRedirectUrl(request, path));
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  // Server Actions must never receive a browser-level redirect; pass through.
  const isServerAction = request.headers.has("next-action");

  if (pathname === "/signup") {
    if (user) {
      if (isServerAction) return response;
      return safeRedirect(request, "/select-clinica");
    }
    if (isServerAction) return response;
    return safeRedirect(request, "/login");
  }

  if (!user) {
    if (!publicPaths.has(pathname)) {
      if (isServerAction) return response;
      return safeRedirect(request, "/login");
    }
    return response;
  }

  // Auth utility routes — let them handle their own redirects.
  if (pathname === "/auth/callback" || pathname === "/auth/logout") {
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
      if (isServerAction) return response;
      return safeRedirect(request, "/select-clinica");
    }
    return response;
  }

  if (!activeClinicaId) {
    if (pathname !== "/select-clinica") {
      if (isServerAction) return response;
      return safeRedirect(request, "/select-clinica");
    }
    return response;
  }

  if (
    pathname === "/select-clinica" ||
    pathname === "/login" ||
    pathname === "/reset-password" ||
    pathname === "/update-password"
  ) {
    if (isServerAction) return response;
    return safeRedirect(request, "/app");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
