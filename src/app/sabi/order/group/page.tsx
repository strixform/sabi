"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  SiInstagram, SiTiktok, SiYoutube, SiX, SiFacebook, SiThreads, SiSpotify, SiTelegram,
} from "react-icons/si";
import { FaLinkedinIn } from "react-icons/fa";

interface Svc { id: string; name: string; action: string; category: string; pricePerUnit: number; minQuantity: number; maxQuantity: number; }

// Premium brand icons + brand colours for a polished, on-brand picker.
const PLATFORMS: { key: string; label: string; Icon: IconType; color: string }[] = [
  { key: "instagram", label: "Instagram", Icon: SiInstagram, color: "#E1306C" },
  { key: "tiktok",    label: "TikTok",    Icon: SiTiktok,    color: "#25F4EE" },
  { key: "youtube",   label: "YouTube",   Icon: SiYoutube,   color: "#FF0000" },
  { key: "twitter",   label: "Twitter / X", Icon: SiX,       color: "#FFFFFF" },
  { key: "facebook",  label: "Facebook",  Icon: SiFacebook,  color: "#1877F2" },
  { key: "threads",   label: "Threads",   Icon: SiThreads,   color: "#FFFFFF" },
  { key: "spotify",   label: "Spotify",   Icon: SiSpotify,   color: "#1DB954" },
  { key: "telegram",  label: "Telegram",  Icon: SiTelegram,  color: "#229ED9" },
  { key: "linkedin",  label: "LinkedIn",  Icon: FaLinkedinIn, color: "#0A66C2" },
];

export default function GroupOrderPage() {
  const [platform, setPlatform] = useState("instagram");
  const [link, setLink] = useState("");
  const [services, setServices] = useState<Svc[]>([]);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [startCounts, setStartCounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    setLoading(true); setServices([]); setQty({}); setStartCounts({}); setResults(null);
    fetch(`/api/sabi/services?category=${platform}`)
      .then(r => r.json())
      .then(d => setServices(Array.isArray(d.services) ? d.services : []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [platform]);

  const naira = (kobo: number) => Math.round((kobo || 0) / 100);
  const chosen = services
    .map(s => ({ s, q: parseInt(qty[s.id] || "") }))
    .filter(x => Number.isFinite(x.q) && x.q > 0);
  const estTotal = chosen.reduce((sum, x) => sum + naira(x.s.pricePerUnit) * x.q, 0);

  const submit = async () => {
    if (!link.trim()) { setMsg("Paste the link first."); return; }
    if (chosen.length === 0) { setMsg("Set a quantity for at least one action (leave the rest empty for None)."); return; }
    // Basic min-quantity guard so the buyer isn't surprised by a server rejection.
    const under = chosen.find(x => x.q < (x.s.minQuantity || 1));
    if (under) { setMsg(`${under.s.action}: minimum is ${under.s.minQuantity}.`); return; }

    setBusy(true); setMsg(""); setResults(null);
    try {
      const res = await fetch("/api/sabi/orders/group", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: link.trim(), items: chosen.map(x => ({ serviceId: x.s.id, quantity: x.q, startCount: startCounts[x.s.id] && Number.isFinite(Number(startCounts[x.s.id])) ? Number(startCounts[x.s.id]) : undefined })) }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setMsg(d.message || "Done."); setResults(d.results || []); }
      else setMsg(d.error || "Group order failed.");
    } catch { setMsg("Network error."); } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black">🧩 Group Order</h1>
          <Link href="/sabi/order" className="text-xs text-blue-400 hover:underline">Single order →</Link>
        </div>
        <p className="text-xs text-gray-400 mb-4">One link, many actions at once. Pick a platform, paste your link, and set a quantity for each action you want (leave the rest empty = <b>None</b>). Each becomes its own order with its own tracking.</p>

        {/* Platform */}
        <div className="flex flex-wrap gap-2 mb-3">
          {PLATFORMS.map(p => {
            const active = platform === p.key;
            return (
              <button key={p.key} onClick={() => setPlatform(p.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all ${active ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-gray-300 hover:border-white/25"}`}>
                <p.Icon className="text-base shrink-0" style={{ color: active ? "#fff" : p.color }} />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Link */}
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="Paste the post / profile / video link"
          className="w-full mb-4 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-sm outline-none focus:border-blue-500/50" />

        {/* Actions */}
        {loading ? <div className="text-gray-500 text-sm py-6 text-center">Loading actions…</div> : (
          <div className="space-y-2 mb-4">
            {services.length === 0 && <div className="text-gray-500 text-sm">No actions for this platform.</div>}
            {services.map(s => {
              const q = qty[s.id] || "";
              const on = Number.isFinite(parseInt(q)) && parseInt(q) > 0;
              return (
                <div key={s.id} className={`rounded-lg p-2.5 border ${on ? "bg-blue-500/[0.06] border-blue-500/30" : "bg-white/[0.02] border-white/10"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{s.action}</div>
                      <div className="text-[11px] text-gray-500">₦{naira(s.pricePerUnit).toLocaleString()} each · min {s.minQuantity?.toLocaleString()}{s.maxQuantity ? ` · max ${s.maxQuantity.toLocaleString()}` : ""}</div>
                    </div>
                    {on && <span className="text-xs text-emerald-300 shrink-0">≈₦{(naira(s.pricePerUnit) * parseInt(q)).toLocaleString()}</span>}
                    <input value={q} onChange={e => setQty(prev => ({ ...prev, [s.id]: e.target.value.replace(/[^0-9]/g, "") }))}
                      inputMode="numeric" placeholder="None"
                      className="w-24 px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-center outline-none focus:border-blue-500/50" />
                  </div>
                  {on && (
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <span className="text-[10px] text-gray-500">Current {s.action.toLowerCase()} now <span className="text-gray-600">(start count, optional)</span></span>
                      <input value={startCounts[s.id] || ""} onChange={e => setStartCounts(prev => ({ ...prev, [s.id]: e.target.value.replace(/[^0-9]/g, "") }))}
                        inputMode="numeric" placeholder="e.g. 200"
                        className="w-24 px-2 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-center outline-none focus:border-blue-500/50" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Total + submit */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-300">{chosen.length} action(s) · est. <b className="text-emerald-300">₦{estTotal.toLocaleString()}</b> <span className="text-[10px] text-gray-500">(+ fees at checkout)</span></div>
          <button onClick={submit} disabled={busy || chosen.length === 0} className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-black text-sm disabled:opacity-40">{busy ? "Placing…" : "Place group order"}</button>
        </div>
        {msg && <div className="text-sm font-bold text-emerald-400 mb-2">{msg}</div>}

        {/* Per-action results */}
        {results && (
          <div className="space-y-1 mt-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between text-xs rounded-lg p-2 ${r.success ? "bg-emerald-500/10 text-emerald-200" : "bg-red-500/10 text-red-200"}`}>
                <span>{r.serviceId} × {r.quantity?.toLocaleString?.() ?? r.quantity}</span>
                <span>{r.success ? `✅ placed · ₦${naira(r.totalPrice || 0).toLocaleString()}` : `❌ ${r.error || "failed"}`}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
