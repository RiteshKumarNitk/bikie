import { createIdempotencyAdapter } from "./infrastructure/idempotency.adapter";
import { createInProcessJobQueue } from "./infrastructure/in-process-job-queue";
import type { PlatformPorts } from "./ports";

export type PlatformModule = {
  ports: PlatformPorts;
};

export type PlatformDeps = Partial<PlatformPorts>;

export function createPlatformModule(overrides: PlatformDeps = {}): PlatformModule {
  return {
    ports: {
      jobs: overrides.jobs ?? createInProcessJobQueue(),
      idempotency: overrides.idempotency ?? createIdempotencyAdapter(),
    },
  };
}

let defaultModule: PlatformModule | null = null;

export function getPlatformModule(): PlatformModule {
  if (!defaultModule) defaultModule = createPlatformModule();
  return defaultModule;
}

export function setPlatformModuleForTests(module: PlatformModule | null): void {
  defaultModule = module;
}

export type { PlatformPorts, JobQueuePort, IdempotencyPort, JobHandler } from "./ports";
export { withRetry } from "./domain/retry";
export { createInProcessJobQueue } from "./infrastructure/in-process-job-queue";
export { createIdempotencyAdapter } from "./infrastructure/idempotency.adapter";

/** Feature flag — when true, SOS fan-out may be enqueued; response shape stays sync unless callers opt in. */
export function isAsyncDispatchEnabled(): boolean {
  return process.env.SOS_ASYNC_DISPATCH === "true";
}
