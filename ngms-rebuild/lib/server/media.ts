import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execute, row, rows } from "@/lib/server/db";
import type { StaffUser } from "@/lib/server/auth";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const TYPES: Record<string, { ext: string; signature: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", signature: b => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", signature: b => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  "image/webp": { ext: "webp", signature: b => b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
  "image/avif": { ext: "avif", signature: b => b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(b.toString("ascii", 8, 16)) },
  "application/pdf": { ext: "pdf", signature: b => b.length >= 5 && b.toString("ascii", 0, 5) === "%PDF-" },
};

export function mediaRoot(): string {
  const configured = process.env.MEDIA_ROOT?.trim();
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("MEDIA_ROOT must be configured to a persistent directory outside public_html.");
  }
  const root = path.resolve(configured || path.join(process.cwd(), "..", "private-media"));
  const publicRoot = path.resolve(process.cwd(), "public");
  if (root === publicRoot || root.startsWith(publicRoot + path.sep)) {
    throw new Error("MEDIA_ROOT cannot be inside the public web directory.");
  }
  return root;
}

export function mediaUrl(id: string): string {
  return "/api/media/" + encodeURIComponent(id);
}

export async function saveMedia(file: File, user: StaffUser, category: string): Promise<Record<string, unknown>> {
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES) {
    throw new Error("Choose a file between 1 byte and 10 MB.");
  }
  const type = TYPES[file.type];
  if (!type) throw new Error("Use JPEG, PNG, WebP, AVIF or PDF files.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!type.signature(bytes)) throw new Error("The uploaded file signature does not match its declared type.");

  const id = randomUUID();
  const objectName = id + "." + type.ext;
  const directory = path.join(mediaRoot(), "uploads");
  await mkdir(directory, { recursive: true, mode: 0o750 });
  await writeFile(path.join(directory, objectName), bytes, { flag: "wx", mode: 0o640 });

  try {
    await execute(
      `INSERT INTO media_assets
       (id,object_name,original_name,content_type,size_bytes,category,alt_text,tags_json,is_published,uploaded_by)
       VALUES (?,?,?,?,?,?,?,? ,0,?)`,
      [id, objectName, file.name.slice(0, 240), file.type, bytes.length, category.slice(0, 80) || "Uncategorised", "", "[]", user.id],
    );
  } catch (error) {
    await unlink(path.join(directory, objectName)).catch(() => undefined);
    throw error;
  }
  return await getMediaRecord(id) as Record<string, unknown>;
}

export async function getMediaRecord(id: string): Promise<Record<string, unknown> | null> {
  const item = await row(
    "SELECT id,original_name,content_type,size_bytes,category,alt_text,tags_json,is_published,uploaded_by,created_at,updated_at FROM media_assets WHERE id=?",
    [id],
  );
  return item ? { ...item, url: mediaUrl(String(item.id)), tags: JSON.parse(String(item.tags_json || "[]")) } as Record<string, unknown> : null;
}

export async function listMedia(): Promise<Record<string, unknown>[]> {
  const items = await rows(
    "SELECT id,original_name,content_type,size_bytes,category,alt_text,tags_json,is_published,uploaded_by,created_at,updated_at FROM media_assets ORDER BY created_at DESC LIMIT 300",
  );
  return items.map(item => ({ ...item, url: mediaUrl(String(item.id)), tags: JSON.parse(String(item.tags_json || "[]")) }));
}

export async function readMediaBytes(id: string, publicOnly: boolean): Promise<{ bytes: Buffer; type: string; filename: string } | null> {
  const item = await row("SELECT object_name,original_name,content_type,is_published FROM media_assets WHERE id=? LIMIT 1", [id]);
  if (!item || (publicOnly && Number(item.is_published) !== 1)) return null;
  const safeName = String(item.object_name);
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|avif|pdf)$/.test(safeName)) return null;
  const bytes = await readFile(path.join(mediaRoot(), "uploads", safeName));
  return { bytes, type: String(item.content_type), filename: String(item.original_name) };
}

export async function updateMedia(id: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const current = await row("SELECT id FROM media_assets WHERE id=?", [id]);
  if (!current) return null;
  const category = typeof body.category === "string" ? body.category.trim().slice(0, 80) : null;
  const alt = typeof body.alt_text === "string" ? body.alt_text.trim().slice(0, 500) : null;
  const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags.filter(v => typeof v === "string").map(v => v.trim().slice(0, 50)).slice(0, 20)) : null;
  const published = typeof body.is_published === "boolean" ? (body.is_published ? 1 : 0) : null;
  const sets: string[] = [];
  const values: unknown[] = [];
  if (category !== null) { sets.push("category=?"); values.push(category || "Uncategorised"); }
  if (alt !== null) { sets.push("alt_text=?"); values.push(alt); }
  if (tags !== null) { sets.push("tags_json=?"); values.push(tags); }
  if (published !== null) { sets.push("is_published=?"); values.push(published); }
  if (sets.length) {
    sets.push("updated_at=CURRENT_TIMESTAMP");
    values.push(id);
    await execute("UPDATE media_assets SET " + sets.join(",") + " WHERE id=?", values);
  }
  return getMediaRecord(id);
}

export async function replaceMedia(id: string, file: File, user: StaffUser): Promise<Record<string, unknown> | null> {
  const current = await row("SELECT object_name FROM media_assets WHERE id=?", [id]);
  if (!current) return null;
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES || !TYPES[file.type]) throw new Error("Unsupported replacement file. Use an image or PDF up to 10 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!TYPES[file.type].signature(bytes)) throw new Error("The uploaded file signature does not match its declared type.");
  const objectName = randomUUID() + "." + TYPES[file.type].ext;
  const directory = path.join(mediaRoot(), "uploads");
  await writeFile(path.join(directory, objectName), bytes, { flag: "wx", mode: 0o640 });
  try {
    await execute(
      "UPDATE media_assets SET object_name=?,original_name=?,content_type=?,size_bytes=?,uploaded_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [objectName, file.name.slice(0, 240), file.type, bytes.length, user.id, id],
    );
  } catch (error) {
    await unlink(path.join(directory, objectName)).catch(() => undefined);
    throw error;
  }
  await unlink(path.join(directory, String(current.object_name))).catch(() => undefined);
  return getMediaRecord(id);
}

export async function removeMedia(id: string): Promise<boolean> {
  const current = await row("SELECT object_name FROM media_assets WHERE id=?", [id]);
  if (!current) return false;
  const usage = await row(
    "SELECT id FROM project_photos WHERE media_id=? LIMIT 1",
    [id],
  );
  if (usage) throw new Error("This photo is linked to a project. Remove the project reference before deleting it.");
  await execute("DELETE FROM media_assets WHERE id=?", [id]);
  await unlink(path.join(mediaRoot(), "uploads", String(current.object_name))).catch(() => undefined);
  return true;
}
