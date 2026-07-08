import { headers } from "next/headers";

export async function getJson<T>(path: string, options?: { auth?: boolean }): Promise<T> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const base = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  const res = await fetch(`${base}${path}`, {
    ...(options?.auth
      ? { headers: { cookie: requestHeaders.get("cookie") ?? "" }, cache: "no-store" as const }
      : { next: { revalidate: 300 } }),
  });
  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}
