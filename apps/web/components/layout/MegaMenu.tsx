"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import type { NavColumn } from "./nav-config";
import { riderMegaMenuColumns } from "./nav-config";

export function MegaMenu({ label = "Explore", columns = riderMegaMenuColumns }: { label?: string; columns?: NavColumn[] }) {
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
            className="glass absolute right-0 top-full mt-3 w-[min(90vw,640px)] rounded-3xl p-6 shadow-xl sm:p-8 lg:left-1/2 lg:right-auto lg:w-[640px] lg:-translate-x-1/2"
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
