import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-xl font-semibold">BIKIE</p>
          <p className="mt-2 max-w-xs text-sm text-foreground/60">
            India&apos;s premium motorcycle travel platform.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
          <div>
            <p className="font-medium">Explore</p>
            <ul className="mt-3 space-y-2 text-foreground/60">
              <li>
                <Link href="/#destinations">Destinations</Link>
              </li>
              <li>
                <Link href="/#bikes">Bikes</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Company</p>
            <ul className="mt-3 space-y-2 text-foreground/60">
              <li>
                <Link href="/#partner">Become a Partner</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Account</p>
            <ul className="mt-3 space-y-2 text-foreground/60">
              <li>
                <Link href="/login">Log in</Link>
              </li>
              <li>
                <Link href="/signup">Sign up</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-7xl text-xs text-foreground/40">
        © {new Date().getFullYear()} BIKIE. All rights reserved.
      </p>
    </footer>
  );
}
