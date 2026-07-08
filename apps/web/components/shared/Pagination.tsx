import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`rounded-full border border-foreground/15 px-4 py-2 text-sm ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-foreground/5"}`}
      >
        Previous
      </Link>
      <span className="px-3 text-sm text-foreground/60">
        Page {page} of {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`rounded-full border border-foreground/15 px-4 py-2 text-sm ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-foreground/5"}`}
      >
        Next
      </Link>
    </nav>
  );
}
