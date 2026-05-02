export function getPublicBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (envUrl && !envUrl.includes("0.0.0.0")) {
    return envUrl.replace(/\/$/, "");
  }

  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host");

  if (host && !host.includes("0.0.0.0")) {
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
