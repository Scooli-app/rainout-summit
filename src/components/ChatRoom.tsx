"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

type Msg = {
  id: number;
  body: string;
  system: boolean;
  createdAt: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatar: string | null;
};

const POLL_MS = 2500;
const URL_RE = /(https?:\/\/[^\s]+)/g;

function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function ChatRoom({ conversationId, meId }: { conversationId: string; meId: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const base = `/api/conversations/${conversationId}/messages`;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(lastId.current ? `${base}?after=${lastId.current}` : base, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Msg[] };
      if (data.messages.length) {
        lastId.current = data.messages[data.messages.length - 1].id;
        setMsgs((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
        });
      }
    } catch {
      /* offline; next poll retries */
    }
  }, [base]);

  useEffect(() => {
    poll();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  useEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setError(null);
    atBottom.current = true;
    const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    if (!res.ok) {
      setDraft(body);
      setError(res.status === 429 ? "Slow down a little" : "Couldn't send. Try again");
      return;
    }
    poll();
  }

  return (
    <>
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto py-5"
        aria-live="polite"
        aria-label="Messages"
      >
        {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Start the conversation</p>}
        <ol className="flex flex-col gap-4">
          {msgs.map((m, i) => {
            if (m.system)
              return (
                <li key={m.id} className="mx-auto max-w-[60ch] text-center text-[0.8125rem] text-muted-foreground">
                  <Linkified text={m.body} />
                </li>
              );
            const mine = m.senderId === meId;
            const prev = msgs[i - 1];
            const grouped =
              prev && !prev.system && prev.senderId === m.senderId && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000;
            return (
              <li key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse", grouped && "-mt-2.5")}>
                <div className="w-8 shrink-0">{!grouped && <Avatar name={m.senderName ?? "?"} url={m.senderAvatar} size={32} />}</div>
                <div className={cn("flex max-w-[78%] min-w-0 flex-col", mine ? "items-end" : "items-start")}>
                  {!grouped && (
                    <p className="mb-1 text-[0.8125rem]">
                      <span className="font-medium">{mine ? "You" : m.senderName ?? "Someone"}</span>{" "}
                      <span className="tnum text-muted-foreground">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </p>
                  )}
                  <p
                    className={cn(
                      "rounded-xl px-3.5 py-2 text-[0.9375rem] leading-snug break-words whitespace-pre-wrap",
                      mine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card ring-1 ring-foreground/10",
                    )}
                  >
                    <Linkified text={m.body} />
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t pt-3">
        <label htmlFor="composer" className="sr-only">
          Message
        </label>
        <Textarea
          id="composer"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Write a message…"
          title="Enter sends, Shift+Enter adds a line"
          className="max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-card"
        />
        <Button type="submit" size="lg" className="h-10 px-3.5" aria-label="Send" disabled={!draft.trim()}>
          <Send aria-hidden /> <span className="hidden sm:inline">Send</span>
        </Button>
      </form>
      {error && (
        <p role="alert" className="pt-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </>
  );
}
