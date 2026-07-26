"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Avatar } from "./ui";
import { timeAgo } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; fullName: string; avatarColor: string };
};

export function Discussion({
  messages,
  currentUserId,
  postAction,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  postAction: (body: string) => Promise<{ ok?: boolean; error?: string }>;
}) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setText("");
    start(async () => {
      await postAction(body);
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto p-1">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--text-dim)]">
            No messages yet. Start the discussion 👇
          </p>
        )}
        {messages.map((m) => {
          const mine = m.author.id === currentUserId;
          return (
            <div key={m.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <Avatar name={m.author.fullName} color={m.author.avatarColor} size={30} />
              <div className={`max-w-[78%] ${mine ? "text-right" : ""}`}>
                <div className="mb-0.5 flex items-center gap-2 text-xs text-[var(--text-dim)]">
                  <span className="font-medium text-[var(--text-muted)]">
                    {mine ? "You" : m.author.fullName}
                  </span>
                  <span>{timeAgo(m.createdAt)}</span>
                </div>
                <div
                  className={`inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${
                    mine
                      ? "rounded-tr-sm bg-[var(--brand)] text-[#17130a]"
                      : "rounded-tl-sm bg-[var(--bg-elev)] text-[var(--text)]"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex items-end gap-2 border-t border-[var(--border)] pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Write a message…  (Enter to send)"
          className="max-h-28 flex-1 resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        <button
          onClick={send}
          disabled={pending || !text.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-[#17130a] disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
