"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Handshake, MessageCircle, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/matches", label: "Matches", Icon: Handshake },
  { href: "/people", label: "People", Icon: Users },
  { href: "/chat", label: "Chat", Icon: MessageCircle },
  { href: "/meetings", label: "Meetings", Icon: CalendarDays },
  { href: "/onboarding", label: "Profile", Icon: UserRound },
];

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(`${href}/`);
}

export function TopNav() {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
      {NAV.slice(0, 4).map(({ href, label }) => {
        const active = isActive(href);
        return (
          <Button
            key={href}
            asChild
            variant="ghost"
            size="lg"
            className={cn("text-[0.9375rem] font-normal", active ? "bg-muted text-foreground" : "text-muted-foreground")}
          >
            <Link href={href} aria-current={active ? "page" : undefined}>
              {label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const isActive = useActive();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs transition-colors",
                  active ? "text-foreground" : "text-subtle-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
