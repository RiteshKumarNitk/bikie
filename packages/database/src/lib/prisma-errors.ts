/** Shared Prisma error predicates. Kept dependency-free (a structural `code` check) so callers
 * don't each import the generated client's error class just to detect a constraint violation. */
export function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "P2002"
  );
}
