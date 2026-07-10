#!/usr/bin/env node
/**
 * One-time import of Owlet emails into the SABI Owlet-promo allowlist.
 *
 * Usage:
 *   SABI_ADMIN_SECRET=xxxx node scripts/import-owlet-emails.mjs ./owlet-emails.csv
 *   # optional 2nd arg = base URL (defaults to https://sability.io)
 *
 * Accepts any text/CSV file — it extracts every email-looking token, de-dupes, and
 * POSTs in chunks of 20,000 to /api/sabi/admin/owlet-emails (auth: X-Admin-Token).
 * Safe to re-run (server does INSERT OR IGNORE).
 */
import fs from "node:fs";

const file = process.argv[2];
const BASE = (process.argv[3] || "https://sability.io").replace(/\/$/, "");
const SECRET = process.env.SABI_ADMIN_SECRET;

if (!file) { console.error("Usage: node scripts/import-owlet-emails.mjs <file> [baseUrl]"); process.exit(1); }
if (!SECRET) { console.error("Set SABI_ADMIN_SECRET in the environment."); process.exit(1); }

const text = fs.readFileSync(file, "utf8");
const emails = Array.from(new Set(
  (text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || []).map((e) => e.trim().toLowerCase())
));
console.log(`Found ${emails.length.toLocaleString()} unique emails in ${file}`);
if (emails.length === 0) process.exit(0);

const CHUNK = 20000;
let added = 0, sent = 0;
for (let i = 0; i < emails.length; i += CHUNK) {
  const batch = emails.slice(i, i + CHUNK);
  const res = await fetch(`${BASE}/api/sabi/admin/owlet-emails`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": SECRET },
    body: JSON.stringify({ emails: batch }),
  }).catch((e) => ({ ok: false, err: e?.message }));
  if (!res.ok) { console.error(`Chunk ${i}-${i + batch.length} FAILED:`, res.status || res.err); process.exit(1); }
  const d = await res.json();
  added += d.added || 0; sent += batch.length;
  console.log(`  ${sent.toLocaleString()}/${emails.length.toLocaleString()} sent · +${(d.added || 0).toLocaleString()} new · total on list: ${(d.total || 0).toLocaleString()}`);
}
console.log(`Done. ${added.toLocaleString()} newly added.`);
