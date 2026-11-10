import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function SignUpPage() {
  if ((await auth()).userId) redirect("/matches");
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
