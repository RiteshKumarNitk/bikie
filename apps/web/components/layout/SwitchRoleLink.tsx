"use client";

import type { ReactNode } from "react";
import { selectRole } from "@/lib/actions/role-actions";
import type { SelectedRole } from "@/lib/role";

/** Small trigger that flips the pre-auth `selectedRole` cookie and redirects
 * to the other experience's home. Rendered from both the (server) Footer
 * and the (client) Navbar, so this itself is a client component — Server
 * Actions can be invoked directly from a client event handler. */
export function SwitchRoleLink({
  to,
  className,
  children,
}: {
  to: SelectedRole;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => selectRole(to)}>
      {children}
    </button>
  );
}
