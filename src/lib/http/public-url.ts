/**
 * Returns the public base URL for this request, safe to use for redirects
 * that the browser will actually follow.
 *
 * Priority:
 * 1. NEXT_PUBLIC_SITE_URL env var (set this in production)
 * 2. x-forwarded-proto + x-forwarded-host (set by Nginx/ALB)
 * 3. x-forwarded-proto + host header
 *
 * Never returns a URL containing 0.0.0.0 or a raw internal bind address.
 */

const INTERNAL_HOSTS = ["0.0.0.0", "[::]", "[::1]"];

function isInternalHost(host: string): boolean {
  return INTERNAL_HOSTS.some((h) => host.startsWith(h));
}

export function getPublicBaseUrl(request: Request): string {
  // 1. Explicit env override — most reliable in production.
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl && !isInternalHost(new URL(envUrl).hostname)) {
    return envUrl.replace(/\/$/, "");
  }

  // 2. Trust reverse-proxy headers (Nginx, AWS ALB, Cloudflare, etc.)
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost && !isInternalHost(forwardedHost)) {
    // x-forwarded-proto can be a comma-separated list; take the first
    const proto = forwardedProto.split(",")[0].trim();
    return `${proto}://${forwardedHost}`;
  }

  // 3. Fall back to the Host header (works when running behind a local reverse proxy).
  const host = request.headers.get("host");
  if (host && !isInternalHost(host)) {
    // Infer proto: if the host includes a port that isn't 443, assume http
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? "http";
    return `${proto}://${host}`;
  }

  // 4. Last resort for local dev (never reached in production if Nginx is configured).
  return "http://localhost:3000";
}

/**
 * Build a safe redirect URL from a path.
 * Always uses the public base URL derived above — never 0.0.0.0.
 */
export function buildRedirectUrl(request: Request, path: string): string {
  const base = getPublicBaseUrl(request);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
