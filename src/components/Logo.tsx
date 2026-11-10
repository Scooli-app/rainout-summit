import { cn } from "@/lib/utils";

/**
 * The storm that cancelled Web Summit, turning up anyway: a rain cloud wearing a
 * "HELLO my name is" sticker, glancing away awkwardly, still drizzling.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-8", className)}>
      {/* still raining, a bit */}
      <path d="M15 38.5c0 1.5-1 2.5-2.2 2.5s-2.2-1-2.2-2.5c0-1.3 2.2-4 2.2-4s2.2 2.7 2.2 4z" fill="var(--logo-drop)" />
      <path d="M24.6 42c0 1.5-1 2.5-2.2 2.5s-2.2-1-2.2-2.5c0-1.3 2.2-4 2.2-4s2.2 2.7 2.2 4z" fill="var(--logo-drop)" />
      {/* cloud */}
      <path d="M10.5 34h27a8.5 8.5 0 0 0 1.1-16.93A12.5 12.5 0 0 0 15 13.4 10.3 10.3 0 0 0 10.5 34z" fill="var(--logo-cloud)" />
      {/* awkward sideways glance */}
      <ellipse cx="18.6" cy="22" rx="2.6" ry="3" fill="#fff" />
      <ellipse cx="27.4" cy="22" rx="2.6" ry="3" fill="#fff" />
      <circle cx="20" cy="21" r="1.4" fill="var(--logo-ink)" />
      <circle cx="28.8" cy="21" r="1.4" fill="var(--logo-ink)" />
      {/* wobbly "sorry" mouth */}
      <path d="M19.5 28.2q1.4-1.2 2.8 0t2.8 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* HELLO my name is */}
      <g transform="rotate(-10 37 30)">
        <rect x="31" y="25" width="13" height="10" rx="1.8" fill="#fff" stroke="var(--logo-ink)" strokeWidth="1.2" />
        <path d="M31.6 27.2a1.2 1.2 0 0 1 1.2-1.6h9.4a1.2 1.2 0 0 1 1.2 1.6v1.6H31.6z" fill="var(--logo-badge)" />
        <path d="M34 32.3h7" stroke="var(--logo-ink)" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-base font-semibold tracking-[-0.01em] whitespace-nowrap">Rainout Summit</span>
    </span>
  );
}
