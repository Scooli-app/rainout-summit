import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth is enforced where data is read: every page, route handler and server action
// goes through getMe() (src/lib/me.ts), which redirects signed-out users.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
