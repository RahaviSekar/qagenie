const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function api<T>(
  path: string,
  opts?: { method?: string; json?: unknown }
): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: opts?.method ?? "GET",
    headers: opts?.json ? { "Content-Type": "application/json" } : {},
    body: opts?.json ? JSON.stringify(opts.json) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}