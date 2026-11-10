import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Caveat, Instrument_Sans } from "next/font/google";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { APP_NAME } from "@/lib/constants";
import { BottomNav, TopNav } from "@/components/Nav";
import { Logo } from "@/components/Logo";
import { HideOn } from "@/components/HideOn";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin", "latin-ext"] });
// Handwriting, used only for the name on Storm's sticker
const hand = Caveat({ variable: "--font-hand", subsets: ["latin"], weight: "600" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s - ${APP_NAME}` },
  description: "Web Summit Lisbon was called off. Meet the people you came to meet, online.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${instrument.variable} ${hand.variable} h-full antialiased`}>
        <body className="flex min-h-full flex-col">
          <TooltipProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <HideOn paths={["/"]}>
            <header className="sticky top-0 z-30 border-b bg-background">
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
                <Link href="/" aria-label={`${APP_NAME} home`}>
                  <Logo />
                </Link>
                <Show when="signed-in">
                  <TopNav />
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="lg" className="hidden font-normal text-muted-foreground md:inline-flex">
                      <Link href="/onboarding">Profile</Link>
                    </Button>
                    <UserButton />
                  </div>
                </Show>
                <Show when="signed-out">
                  <span className="hidden md:block" />
                  <div className="flex justify-end">
                    <SignInButton mode="modal">
                      <Button variant="ghost" size="lg" className="font-normal text-muted-foreground">
                        Log in
                      </Button>
                    </SignInButton>
                  </div>
                </Show>
              </div>
            </header>
            </HideOn>
            <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 pt-8 pb-28 sm:px-6 md:pt-12 md:pb-20">
              {children}
            </main>
            <footer className="hidden border-t md:block">
              <div className="mx-auto flex max-w-6xl justify-between px-6 py-6 text-sm text-subtle-foreground">
                <span>Independent community project. Not affiliated with Web Summit</span>
                <span className="tnum">Lisbon, November 2026</span>
              </div>
            </footer>
            <Show when="signed-in">
              <BottomNav />
            </Show>
            <Toaster position="top-center" />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
