import Link from "next/link";

const columns = [
  {
    heading: "Explore",
    links: [
      { label: "Explore Bikes", href: "/explore-bikes" },
      { label: "Destinations", href: "/destinations" },
      { label: "Trips", href: "/trips" },
      { label: "Community", href: "/community" },
      { label: "Roadside Assistance", href: "/roadside-assistance" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
      { label: "Become a Partner", href: "/become-a-partner" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Safety Center", href: "/safety-center" },
      { label: "Contact", href: "/contact" },
      { label: "Membership", href: "/membership" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <p className="font-display text-xl font-semibold">BIKIE</p>
          <p className="mt-2 text-sm text-foreground/60">
            India&apos;s premium motorcycle travel platform.
          </p>
          <div className="mt-6 flex gap-4 text-sm text-foreground/60">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer">
              Facebook
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
          <div className="mt-6 flex gap-3">
            <span className="rounded-xl border border-foreground/15 px-4 py-2 text-xs text-foreground/60">
              Google Play
            </span>
            <span className="rounded-xl border border-foreground/15 px-4 py-2 text-xs text-foreground/60">
              App Store
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.heading}>
              <p className="font-medium">{column.heading}</p>
              <ul className="mt-3 space-y-2 text-foreground/60">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-7xl text-xs text-foreground/40">
        © {new Date().getFullYear()} BIKIE. All rights reserved.
      </p>
    </footer>
  );
}
