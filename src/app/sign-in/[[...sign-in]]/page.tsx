import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function SignInPage() {
  // Clerk renders nothing for an already signed-in user; send them into the app instead.
  if ((await auth()).userId) redirect("/matches");
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
