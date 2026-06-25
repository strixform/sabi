'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Service } from '@/lib/servicesCatalog';
import {
  SERVICES_CATALOG,
  computeServicePricing,
  getCategoriesWithServices,
  getPlatformLabel,
  VOLUME_TIERS,
} from '@/lib/servicesCatalog';

/**
 * Order Cost Calculator — pick a service + quantity and see exactly what it costs,
 * so a buyer knows how much to fund their wallet BEFORE ordering. Uses the same
 * shared computeServicePricing() the order engine charges with, so the number here
 * always matches checkout (volume discount + 15% fee/VAT included).
 */
export default function CalculatorPage() {
  // Group catalog by platform for the picker (memoised — catalog is static).
  const grouped = useMemo(() => {
    const map = getCategoriesWithServices();
    return [...map.entries()].map(([platform, services]) => ({
      platform,
      label: getPlatformLabel(platform),
      services,
    }));
  }, []);

  const [serviceId, setServiceId] = useState<string>(SERVICES_CATALOG[0]?.id ?? '');
  const service: Service | undefined = useMemo(
    () => SERVICES_CATALOG.find((s) => s.id === serviceId),
    [serviceId],
  );

  const isFlatDuration = service?.priceModel === 'flat_duration';
  const [quantity, setQuantity] = useState<number>(service?.minQuantity ?? 1000);
  const [durationMins, setDurationMins] = useState<number | undefined>(
    service?.durationOptions?.[0],
  );
  const [wallet, setWallet] = useState<number | null>(null); // kobo

  // When the service changes, reset quantity/duration to its valid defaults.
  useEffect(() => {
    if (!service) return;
    setQuantity(service.minQuantity);
    setDurationMins(service.durationOptions?.[0]);
  }, [serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Best-effort wallet balance so we can show the shortfall (kobo).
  useEffect(() => {
    let alive = true;
    fetch('/api/sabi/wallet')
      .then((r) => r.json())
      .then((d) => { if (alive && d?.success) setWallet(Number(d.balance) || 0); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const clampedQty = useMemo(() => {
    if (!service) return 0;
    const q = Math.floor(Number(quantity) || 0);
    return Math.min(service.maxQuantity, Math.max(service.minQuantity, q));
  }, [quantity, service]);

  const pricing = useMemo(() => {
    if (!service) return null;
    return computeServicePricing(service, clampedQty, durationMins);
  }, [service, clampedQty, durationMins]);

  const naira = (kobo: number) =>
    (kobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalKobo = pricing?.totalKobo ?? 0;
  const shortfallKobo = wallet === null ? 0 : Math.max(0, totalKobo - wallet);
  const enoughFunds = wallet !== null && wallet >= totalKobo;

  // Quick-pick quantities within the service's allowed range.
  const quickQtys = useMemo(() => {
    if (!service) return [];
    const base = [100, 500, 1000, 5000, 10000, 20000, 50000];
    return base.filter((q) => q >= service.minQuantity && q <= service.maxQuantity);
  }, [service]);

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-black">🧮 Order Calculator</h1>
          <Link href="/sabi/order" className="text-xs font-bold text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1.5 hover:bg-blue-500/20 transition">
            Go to order →
          </Link>
        </div>
        <p className="text-sm text-slate-400 mb-5">
          Pick a service and quantity to see the exact cost — then you know how much to fund.
        </p>

        {/* Service picker */}
        <label className="block text-xs font-bold text-slate-400 mb-1">Service</label>
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
          className="w-full mb-4 px-3 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm outline-none focus:border-blue-500"
        >
          {grouped.map((g) => (
            <optgroup key={g.platform} label={g.label}>
              {g.services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.action}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {service && (
          <>
            {/* Quantity (per_unit) or fixed pack note (flat_duration) */}
            {!isFlatDuration ? (
              <>
                <label className="block text-xs font-bold text-slate-400 mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  min={service.minQuantity}
                  max={service.maxQuantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  onBlur={() => setQuantity(clampedQty)}
                  className="w-full px-3 py-3 rounded-xl bg-slate-900 border border-slate-700 text-lg font-bold outline-none focus:border-blue-500"
                />
                <div className="text-[11px] text-slate-500 mt-1 mb-2">
                  Min {service.minQuantity.toLocaleString()} • Max {service.maxQuantity.toLocaleString()}
                  {clampedQty !== Number(quantity) && (
                    <span className="text-amber-400"> • will use {clampedQty.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {quickQtys.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuantity(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${clampedQty === q ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-500'}`}
                    >
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="mb-4 text-xs text-slate-400 bg-slate-900 border border-slate-700 rounded-xl p-3">
                This service is priced by watch-time. It ships a fixed pack of{' '}
                <b>{(service.standardPack ?? service.minQuantity).toLocaleString()}</b> viewers — the
                price depends on the duration you choose below, not the quantity.
              </div>
            )}

            {/* Duration picker (live / flat_duration services) */}
            {service.durationOptions?.length ? (
              <>
                <label className="block text-xs font-bold text-slate-400 mb-1">Watch time</label>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {service.durationOptions.map((m) => (
                    <button
                      key={m}
                      onClick={() => setDurationMins(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${durationMins === m ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-blue-500'}`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {/* Cost breakdown */}
            {pricing && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 mb-4">
                <div className="text-[11px] font-bold text-slate-500 mb-2">COST BREAKDOWN</div>
                <Row label={isFlatDuration ? `${durationMins ?? 0} min watch-time` : `${clampedQty.toLocaleString()} × ₦${naira(service.pricePerUnit)}`} value={`₦${naira(pricing.grossBaseKobo)}`} />
                {pricing.discountKobo > 0 && (
                  <Row label={`Volume discount (${Math.round(pricing.discountRate * 100)}% off)`} value={`−₦${naira(pricing.discountKobo)}`} green />
                )}
                <Row label="Service fee + VAT (15%)" value={`₦${naira(pricing.platformFeeKobo + pricing.vatKobo)}`} />
                <div className="border-t border-slate-700 my-2" />
                <div className="flex items-center justify-between">
                  <span className="font-black">Total to fund</span>
                  <span className="font-black text-xl text-emerald-400">₦{naira(totalKobo)}</span>
                </div>
              </div>
            )}

            {/* Volume-discount hint */}
            {!isFlatDuration && pricing && pricing.discountKobo === 0 && (
              <p className="text-[11px] text-slate-500 mb-4">
                💡 Order {VOLUME_TIERS[VOLUME_TIERS.length - 1].min.toLocaleString()}+ for{' '}
                {VOLUME_TIERS[VOLUME_TIERS.length - 1].label}, or {VOLUME_TIERS[0].min.toLocaleString()}+ for {VOLUME_TIERS[0].label}.
              </p>
            )}

            {/* Wallet comparison */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
              {wallet === null ? (
                <p className="text-sm text-slate-400">Sign in to see your wallet balance and shortfall.</p>
              ) : enoughFunds ? (
                <p className="text-sm text-emerald-400 font-bold">
                  ✓ Your wallet (₦{naira(wallet)}) covers this. You can order now.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">Wallet balance</span>
                    <span className="font-bold">₦{naira(wallet)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">You need to fund</span>
                    <span className="font-black text-amber-400">₦{naira(shortfallKobo)}</span>
                  </div>
                  <Link
                    href="/sabi/wallet"
                    className="mt-3 block text-center bg-emerald-600 hover:bg-emerald-500 rounded-xl py-2.5 font-black text-sm transition"
                  >
                    Fund ₦{naira(shortfallKobo)} →
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className={green ? 'text-emerald-400 font-bold' : 'font-semibold'}>{value}</span>
    </div>
  );
}
