"use client";

import { useState, useTransition } from "react";
import {
  FileSpreadsheet,
  Presentation,
  FileText,
  PenTool,
  HardDrive,
  Image as ImageIcon,
  Link2,
  Plus,
  X,
} from "lucide-react";
import { deleteAttachment } from "@/app/actions/attachments";

export type Attachment = { id: string; title: string; url: string; kind: string };

const KIND: Record<string, { icon: typeof Link2; color: string }> = {
  sheet: { icon: FileSpreadsheet, color: "#35b06a" },
  slides: { icon: Presentation, color: "#e0863a" },
  doc: { icon: FileText, color: "#6b8cc4" },
  figma: { icon: PenTool, color: "#a88bc4" },
  drive: { icon: HardDrive, color: "#d6a43e" },
  image: { icon: ImageIcon, color: "#c9748a" },
  link: { icon: Link2, color: "#8b95ad" },
};

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function AttachmentsPanel({
  attachments,
  canEdit,
  addAction,
}: {
  attachments: Attachment[];
  canEdit: boolean;
  addAction: (formData: FormData) => Promise<{ ok?: boolean; error?: string }>;
}) {
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {attachments.map((a) => {
          const meta = KIND[a.kind] ?? KIND.link;
          const Icon = meta.icon;
          return (
            <div key={a.id} className="group relative">
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-2.5 transition-colors hover:border-[var(--brand)]"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
                >
                  <Icon size={16} />
                </span>
                <span className="truncate text-xs font-medium">{a.title}</span>
                <span className="truncate text-[10px] text-[var(--text-dim)]">{host(a.url)}</span>
              </a>
              {canEdit && (
                <button
                  onClick={() => start(() => void deleteAttachment(a.id))}
                  disabled={pending}
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-[var(--danger)] text-white group-hover:flex"
                  title="Remove"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {attachments.length === 0 && !adding && (
        <p className="text-xs text-[var(--text-dim)]">No files or links yet.</p>
      )}

      {canEdit &&
        (adding ? (
          <form
            action={(fd) =>
              start(async () => {
                setError(null);
                const res = await addAction(fd);
                if (res?.error) setError(res.error);
                else setAdding(false);
              })
            }
            className="space-y-2 rounded-lg border border-dashed border-[var(--border)] p-2.5"
          >
            <input
              name="url"
              required
              placeholder="Paste link (Sheet, Slides, Drive, Figma…)"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
            />
            <input
              name="title"
              placeholder="Label (optional)"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-elev)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--brand)]"
            />
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 rounded-md bg-[var(--brand)] px-2 py-1.5 text-xs font-medium text-[#17130a] disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-md border border-[var(--border)] px-2 py-1.5 text-xs text-[var(--text-muted)]"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--text)]"
          >
            <Plus size={14} /> Add file / link
          </button>
        ))}
    </div>
  );
}
