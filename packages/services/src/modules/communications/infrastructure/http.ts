/** Bounded fetch for provider adapters — prevents hung serverless invocations. */

export type FetchWithTimeoutInit = RequestInit & { timeoutMs?: number };

export async function fetchWithTimeout(
  input: string | URL,
  init: FetchWithTimeoutInit = {},
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? Number(process.env.PROVIDER_HTTP_TIMEOUT_MS ?? "10000");
  const { timeoutMs: _ignored, signal: outerSignal, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 10000);

  if (outerSignal) {
    if (outerSignal.aborted) controller.abort();
    else outerSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Provider request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
