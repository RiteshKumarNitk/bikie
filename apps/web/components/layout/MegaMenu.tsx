"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";

interface MegaMenuColumn {
  heading: string;
  links: { label: string; href: string }[];
}

const columns: MegaMenuColumn[] = [
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
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Blog", href: "/blog" },
      { label: "Become a Partner", href: "/become-a-partner" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Safety Center", href: "/safety-center" },
      { label: "Contact Us", href: "/contact" },
      { label: "Membership", href: "/membership" },
      { label: "Gift Cards", href: "/gift-cards" },
    ],
  },
];

export function MegaMenu({ label = "Explore" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function show() {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  }

  function hide() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        className="flex items-center gap-1 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="glass absolute left-1/2 top-full mt-3 w-[640px] -translate-x-1/2 rounded-3xl p-8 shadow-xl"
          >
            <div className="grid grid-cols-3 gap-8">
              {columns.map((column) => (
                <div key={column.heading}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                    {column.heading}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="text-sm hover:text-accent-text" onClick={() => setOpen(false)}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
