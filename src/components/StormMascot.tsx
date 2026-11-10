import { cn } from "@/lib/utils";

/**
 * Storm, the cloud that cancelled Web Summit, now very sorry about it.
 * Same geometry as the logo, with worried brows, blush and a filled-in name sticker.
 */
export function StormMascot({ className }: { className?: string }) {
  const drops = [
    { x: 11, d: "0s" },
    { x: 17.5, d: "0.9s" },
    { x: 24, d: "0.35s" },
    { x: 30.5, d: "1.25s" },
    { x: 37, d: "0.6s" },
  ];
  return (
    <svg viewBox="0 0 48 56" role="img" aria-label="Charles, a guilty-looking rain cloud wearing a name sticker" className={cn("w-full", className)}>
      {/* drizzle */}
      {drops.map((r) => (
        <path
          key={r.x}
          className="storm-drop"
          style={{ animationDelay: r.d }}
          d={`M${r.x + 1.6} 40.5c0 1.2-.8 2-1.6 2s-1.6-.8-1.6-2c0-1 1.6-3 1.6-3s1.6 2 1.6 3z`}
          fill="var(--logo-drop)"
        />
      ))}
      {/* cloud */}
      <path d="M10.5 34h27a8.5 8.5 0 0 0 1.1-16.93A12.5 12.5 0 0 0 15 13.4 10.3 10.3 0 0 0 10.5 34z" fill="var(--logo-cloud)" />
      {/* worried brows */}
      <path d="M15.6 17.9l4.6-1.5M30.4 17.9l-4.6-1.5" stroke="var(--logo-ink)" strokeWidth="0.9" strokeLinecap="round" />
      {/* eyes, looking down at its shoes */}
      <ellipse cx="18.6" cy="22" rx="2.6" ry="3" fill="#fff" />
      <ellipse cx="27.4" cy="22" rx="2.6" ry="3" fill="#fff" />
      <circle cx="18.9" cy="23.3" r="1.35" fill="var(--logo-ink)" />
      <circle cx="27.7" cy="23.3" r="1.35" fill="var(--logo-ink)" />
      {/* blush */}
      <ellipse cx="14.6" cy="26.6" rx="2" ry="1.1" fill="#ff8fab" opacity="0.55" />
      <ellipse cx="31.2" cy="26.6" rx="2" ry="1.1" fill="#ff8fab" opacity="0.55" />
      {/* wobbly sorry mouth */}
      <path d="M19.5 28.8q1.4-1.2 2.8 0t2.8 0" stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* HELLO my name is Charles */}
      <g transform="rotate(-9 39 31)">
        <rect x="32" y="25.5" width="14.5" height="11" rx="1.4" fill="#fff" stroke="var(--logo-ink)" strokeWidth="0.6" />
        <path d="M32.3 26.9a1.1 1.1 0 0 1 1.1-1.1h12.1a1.1 1.1 0 0 1 1.1 1.1v2.7H32.3z" fill="var(--logo-badge)" />
        <text x="39.25" y="28.55" textAnchor="middle" fontSize="2.1" fontWeight="700" fill="#fff" fontFamily="var(--font-instrument), sans-serif">
          HELLO
        </text>
        <text x="39.25" y="30.9" textAnchor="middle" fontSize="1.05" fill="#4b5565" fontFamily="var(--font-instrument), sans-serif">
          my name is
        </text>
        <text x="39.25" y="35.1" textAnchor="middle" fontSize="3.3" fill="#111827" fontFamily="var(--font-hand), cursive">
          Charles
        </text>
      </g>
    </svg>
  );
}
