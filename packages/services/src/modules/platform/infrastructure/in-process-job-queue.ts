import type { EnqueueOptions, JobHandler, JobQueuePort } from "../ports";

/**
 * Default queue — executes the handler immediately in the same process.
 * Deduplicates in-flight/completed keys for the process lifetime (best-effort local only).
 */
export function createInProcessJobQueue(): JobQueuePort {
  const seen = new Set<string>();

  return {
    async enqueue<TPayload>(
      _name: string,
      payload: TPayload,
      handler: JobHandler<TPayload>,
      options: EnqueueOptions = {},
    ) {
      if (options.idempotencyKey) {
        if (seen.has(options.idempotencyKey)) {
          return { accepted: true as const, deduplicated: true };
        }
        seen.add(options.idempotencyKey);
      }
      await handler(payload);
      return { accepted: true as const, deduplicated: false };
    },
  };
}
