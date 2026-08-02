const sizes = {
  sm: "h-8 w-8 text-sm",
  md: "h-9 w-9 text-base",
  lg: "h-10 w-10 text-lg",
} as const;

export type LogoMarkSize = keyof typeof sizes;

/**
 * The BIKIE "B" brand mark. Single source of truth so the navbar, footer, auth
 * and onboarding screens all match the welcome splash instead of drifting onto
 * the indigo `accent` fill.
 */
export function LogoMark({
  size = "sm",
  className = "",
}: {
  size?: LogoMarkSize;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-display font-bold leading-none text-white ring-2 ring-white/15 ${sizes[size]} ${className}`}
      aria-hidden="true"
    >
      B
    </span>
  );
}
