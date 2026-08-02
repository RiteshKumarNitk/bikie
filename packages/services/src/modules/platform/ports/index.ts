export type JobHandler<TPayload = unknown> = (payload: TPayload) => Promise<void>;

export type EnqueueOptions = {
  /** Stable key — duplicate enqueues with the same key are skipped while the first is remembered. */
  idempotencyKey?: string;
};

/**
 * Job queue port — default adapter runs in-process (sync). Future Redis/worker adapters
 * can replace it behind a feature flag without changing callers.
 */
export interface JobQueuePort {
  enqueue<TPayload>(
    name: string,
    payload: TPayload,
    handler: JobHandler<TPayload>,
    options?: EnqueueOptions,
  ): Promise<{ accepted: true; deduplicated?: boolean }>;
}

export interface IdempotencyPort {
  /** Returns true if this key was newly claimed; false if already seen within TTL. */
  claim(key: string, ttlSeconds: number): Promise<boolean>;
  /** Store a JSON-serializable result for later replay (optional). */
  remember(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  recall<T>(key: string): Promise<T | null>;
}

export interface PlatformPorts {
  jobs: JobQueuePort;
  idempotency: IdempotencyPort;
}
