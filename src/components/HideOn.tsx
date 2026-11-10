"use client";

import { usePathname } from "next/navigation";

/** Renders children everywhere except the given paths (the landing page has no top bar). */
export function HideOn({ paths, children }: { paths: string[]; children: React.ReactNode }) {
  const path = usePathname();
  return paths.includes(path) ? null : <>{children}</>;
}
