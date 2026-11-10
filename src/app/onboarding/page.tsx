import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/me";
import { ImportForm, ProfileForm, VerifyForm } from "@/components/forms";
import { RoleTag, VerifiedMark } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Your profile" };

export default async function Onboarding({ searchParams }: PageProps<"/onboarding">) {
  const sp = await searchParams;
  const ws = typeof sp.ws === "string" ? sp.ws.trim().slice(0, 500) : "";
  if (!(await auth()).userId) {
    // Came from the landing page: sign in first, then land back here with the link
    const back = ws ? `/onboarding?ws=${encodeURIComponent(ws)}` : "/onboarding";
    redirect(`/sign-in?redirect_url=${encodeURIComponent(back)}`);
  }
  const me = await getMe();
  const linked = !!(me.pendingWsProfileId || me.wsProfileId);
  const needsVerify = !!me.pendingWsProfileId && !me.wsVerified;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Card className="py-6">
        <CardContent className="flex flex-col items-center gap-5 px-6 text-center sm:flex-row sm:text-left">
          <Avatar name={me.name} url={me.avatarUrl} size={80} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="page-title">{me.name}</h1>
              {me.wsVerified && <VerifiedMark />}
            </div>
            <p className="mt-1 text-muted-foreground">{[me.jobTitle, me.company].filter(Boolean).join(" at ") || "Add your role below"}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <RoleTag role={me.role} />
              {me.location && <span className="text-sm text-subtle-foreground">{me.location}</span>}
            </div>
          </div>
          {me.onboarded && (
            <Button asChild variant="outline" size="lg">
              <Link href={`/people/${me.id}`}>View public profile</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {!me.onboarded && <p className="px-1 text-muted-foreground">Bring your Web Summit profile over, then tell us what you&apos;re here for</p>}

      <Card className="gap-6 py-6">
        <CardHeader className="px-6">
          <CardTitle className="section-title">Import from Web Summit</CardTitle>
          <CardDescription>
            In the Web Summit app, open your profile and tap <span className="text-foreground">Copy profile link</span>. We only read that public
            page, never your password
          </CardDescription>
          <CardAction>
            {me.wsVerified ? <VerifiedMark withLabel /> : linked && <span className="text-sm text-success">Imported</span>}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-6">
          <ImportForm defaultUrl={ws || undefined} autoSubmit={!!ws && !linked} />
          {needsVerify && (
            <div className="rounded-lg border bg-background p-5">
              <p className="font-medium">
                Get the verified tick <span className="font-normal text-muted-foreground">(optional)</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Add this code anywhere in your Web Summit bio, then check. You can delete it straight after</p>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <code className="tnum rounded-lg border bg-card px-3 py-1.5 font-mono text-lg tracking-[0.08em] select-all">{me.verifyCode}</code>
                <VerifyForm />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remount only when an import changes the defaults */}
      <ProfileForm key={me.pendingWsProfileId ?? me.wsProfileId ?? "manual"} p={me} />
    </div>
  );
}
