"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Link2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { createGroup, importWsProfile, saveProfile, verifyWsProfile, type FormState } from "@/app/actions";
import { INDUSTRIES, INTENTS, ROLES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function Submit({
  children,
  pendingText,
  className,
  variant = "default",
  disabled = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" variant={variant} className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
          {pendingText ?? "Working…"}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Toast once per successful action result. */
function useToastOnSuccess(state: FormState) {
  const last = useRef<FormState | null>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
}

export function ImportForm({ defaultUrl, autoSubmit }: { defaultUrl?: string; autoSubmit?: boolean }) {
  const [state, action] = useActionState(importWsProfile, {});
  const form = useRef<HTMLFormElement>(null);
  const fired = useRef(false);
  useToastOnSuccess(state);
  useEffect(() => {
    // Arriving from the landing page with a link: import straight away
    if (autoSubmit && defaultUrl && !fired.current) {
      fired.current = true;
      form.current?.requestSubmit();
    }
  }, [autoSubmit, defaultUrl]);
  return (
    <form ref={form} action={action}>
      <Field data-invalid={!!state.error}>
        <FieldLabel htmlFor="ws-url">Web Summit profile link</FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="h-10 flex-1">
            <InputGroupAddon>
              <Link2 aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="ws-url"
              name="url"
              inputMode="url"
              defaultValue={defaultUrl}
              placeholder="attend.websummit.com/…"
              required
              autoComplete="off"
              aria-invalid={!!state.error}
            />
          </InputGroup>
          <Submit pendingText="Importing…" className="h-10">
            Import
          </Submit>
        </div>
        {state.error && <FieldError>{state.error}</FieldError>}
      </Field>
    </form>
  );
}

export function VerifyForm() {
  const [state, action] = useActionState(verifyWsProfile, {});
  useToastOnSuccess(state);
  return (
    <form action={action} className="flex flex-col gap-2">
      <Submit pendingText="Checking…" variant="outline">
        I&apos;ve added it, check now
      </Submit>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

type ProfileDefaults = {
  name: string;
  jobTitle: string | null;
  company: string | null;
  location: string | null;
  industry: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  contactEmail: string | null;
  whatsapp: string | null;
  role: string;
  lookingFor: string[];
  offering: string[];
  tags: string[];
  onboarded: boolean;
};

function IntentPicker({ name, legend, description, selected }: { name: string; legend: string; description: string; selected: string[] }) {
  const [value, setValue] = useState<string[]>(selected);
  return (
    <FieldSet>
      <FieldLegend variant="label">{legend}</FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      {value.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <ToggleGroup
        type="multiple"
        variant="outline"
        spacing={2}
        value={value}
        onValueChange={(v) => setValue(v.slice(0, 5))}
        className="flex-wrap justify-start"
      >
        {INTENTS.map((i) => (
          <ToggleGroupItem
            key={i}
            value={i}
            className="h-9 rounded-lg px-3 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {i}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FieldSet>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="gap-6 py-6">
      <CardHeader className="px-6">
        <CardTitle className="section-title">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-6">{children}</CardContent>
    </Card>
  );
}

const Optional = () => <span className="font-normal text-muted-foreground">(optional)</span>;

export function ProfileForm({ p }: { p: ProfileDefaults }) {
  const [state, action] = useActionState(saveProfile, {});
  useToastOnSuccess(state);
  return (
    <form action={action} className="flex flex-col gap-6">
      <Section title="About you">
        <FieldGroup>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" name="name" defaultValue={p.name} required autoComplete="name" className="h-10" />
            </Field>
            <Field>
              <FieldLabel htmlFor="role">You&apos;re here as</FieldLabel>
              <Select name="role" defaultValue={p.role}>
                <SelectTrigger id="role" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r[0].toUpperCase() + r.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="jobTitle">Job title</FieldLabel>
              <Input id="jobTitle" name="jobTitle" defaultValue={p.jobTitle ?? ""} autoComplete="organization-title" className="h-10" />
            </Field>
            <Field>
              <FieldLabel htmlFor="company">Company</FieldLabel>
              <Input id="company" name="company" defaultValue={p.company ?? ""} autoComplete="organization" className="h-10" />
            </Field>
            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input id="location" name="location" defaultValue={p.location ?? ""} className="h-10" />
            </Field>
            <Field>
              <FieldLabel htmlFor="industry">Industry</FieldLabel>
              <Input id="industry" name="industry" list="industries" defaultValue={p.industry ?? ""} className="h-10" />
              <datalist id="industries">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="bio">Bio</FieldLabel>
            <Textarea id="bio" name="bio" rows={4} defaultValue={p.bio ?? ""} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tags">
              Topics <Optional />
            </FieldLabel>
            <Input id="tags" name="tags" defaultValue={p.tags.join(", ")} className="h-10" />
            <FieldDescription>Comma separated, like genai, b2b saas, seed</FieldDescription>
          </Field>
        </FieldGroup>
      </Section>

      <Section title="What you're here for" description="Matching runs on this, so be specific">
        <FieldGroup>
          <IntentPicker name="lookingFor" legend="You're looking for" description="Up to five" selected={p.lookingFor} />
          <IntentPicker name="offering" legend="You can offer" description="Up to five" selected={p.offering} />
        </FieldGroup>
      </Section>

      <Section title="Contact" description="Only shared with people you've chatted or booked a call with">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={p.contactEmail ?? ""} required autoComplete="email" className="h-10" />
          </Field>
          <Field>
            <FieldLabel htmlFor="whatsapp">
              WhatsApp <Optional />
            </FieldLabel>
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={p.whatsapp ?? ""} placeholder="+351 912 345 678" autoComplete="tel" className="tnum h-10" />
          </Field>
          <Field>
            <FieldLabel htmlFor="linkedinUrl">
              LinkedIn <Optional />
            </FieldLabel>
            <Input id="linkedinUrl" name="linkedinUrl" inputMode="url" defaultValue={p.linkedinUrl ?? ""} placeholder="https://linkedin.com/in/…" className="h-10" />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-wrap items-center gap-4 border-t bg-background px-4 py-3 md:bottom-0">
        <Submit pendingText="Saving…" className="h-10 px-5">
          {p.onboarded ? "Save profile" : "Save and see my matches"}
        </Submit>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
    </form>
  );
}

export function GroupForm({ people }: { people: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createGroup, {});
  return (
    <form action={action}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="group-title">Group name</FieldLabel>
          <Input id="group-title" name="title" placeholder="Edtech founders, Thursday" required maxLength={80} className="h-10" />
        </Field>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">People you message or match with show up here, ready to add</p>
        ) : (
          <FieldSet>
            <FieldLegend variant="label">Add people</FieldLegend>
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {people.map((p) => (
                <Field key={p.id} orientation="horizontal" className="min-h-9">
                  <Checkbox id={`m-${p.id}`} name="members" value={p.id} />
                  <FieldLabel htmlFor={`m-${p.id}`} className="font-normal">
                    {p.name}
                  </FieldLabel>
                </Field>
              ))}
            </div>
          </FieldSet>
        )}
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Submit pendingText="Creating…">Create group</Submit>
      </FieldGroup>
    </form>
  );
}
