import { randomBytes } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

// Uploaded documents (invoices, TRC, bank proofs...) hold sensitive data, so
// they are stored OUTSIDE the web root and served only through an auth-gated
// route (app/api/payment-doc/[docId]/route.ts) — never from /public.
//
// On the VPS set UPLOAD_DIR=/var/www/portal-data/uploads so files survive
// every code deploy. Locally it defaults to ./uploads (gitignored).
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type SavedUpload = {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
};

export function isAllowedUpload(file: File): boolean {
  return Boolean(ALLOWED_MIME[file.type]);
}

/** Validate and write one uploaded file. Returns null when no file was given. */
export async function saveUpload(file: File | null): Promise<SavedUpload | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;

  if (!isAllowedUpload(file)) {
    throw new Error(`"${file.name}" must be a PDF, JPG, PNG or WEBP file.`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is larger than 10 MB.`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = ALLOWED_MIME[file.type];
  const storedName = `${Date.now()}-${randomBytes(12).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);

  return {
    originalName: file.name.slice(0, 180),
    storedName,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

/** Read a stored file for the download route. Rejects any path trickery. */
export async function readUpload(storedName: string): Promise<Buffer> {
  const safe = path.basename(storedName);
  return readFile(path.join(UPLOAD_DIR, safe));
}

export async function deleteUpload(storedName: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, path.basename(storedName)));
  } catch {
    // already gone — nothing to do
  }
}
