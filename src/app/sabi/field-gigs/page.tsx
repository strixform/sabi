'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiMapPin, FiArrowRight, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import { ModernSabiHeader } from '@/components/ModernSabiHeader';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { getServiceById, computeServicePricing } from '@/lib/servicesCatalog';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

export default function FieldGigBookingPage() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  useEffect(() => { setServiceId(new URLSearchParams(window.location.search).get('service')); }, []);

  const service = useMemo(() => (serviceId ? getServiceById(serviceId) : null), [serviceId]);

  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [headcount, setHeadcount] = useState<number>(0);
  const [preferredDate, setPreferredDate] = useState('');
  const [contact, setContact] = useState('');
  const [taskBrief, setTaskBrief] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { if (service && headcount === 0) setHeadcount(service.minQuantity); }, [service, headcount]);

  const qtyOk = service ? headcount >= service.minQuantity && headcount <= service.maxQuantity : false;
  const priceKobo = service && qtyOk ? computeServicePricing(service, headcount).totalKobo : 0;
  const ready = Boolean(service && qtyOk && state && contact.trim() && taskBrief.trim().length >= 10);

  async function book() {
    if (!ready || !service) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/sabi/field-gigs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId: service.id, state, city, headcount, preferredDate, contact, taskBrief }),
      });
      const d = await r.json();
      if (r.ok && d.success) setDone(true);
      else setErr(d.error || 'Could not book this gig. Please try again.');
    } catch {
      setErr('Network error — please try again.');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen relative bg-[#030507]">
      <AnimatedBackground />
      <ModernSabiHeader showNavigation={true} />

      <section className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <Link href="/sabi/services" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6">
          <FiArrowLeft /> Back to services
        </Link>

        {!service ? (
          <div className="premium-glass rounded-2xl p-8 text-center text-slate-300">
            <p>Pick a field gig from the <Link href="/sabi/services" className="text-blue-400 underline">services page</Link> to book it.</p>
          </div>
        ) : done ? (
          <div className="premium-glass rounded-2xl p-8 text-center">
            <FiCheckCircle className="mx-auto text-emerald-400 w-12 h-12 mb-3" />
            <h1 className="text-xl font-black text-white mb-2">Field gig booked 🎉</h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-md mx-auto">
              Paid from your SABI wallet. Our field team will coordinate <b>{service.name}</b> in
              {' '}<b>{state}{city ? `, ${city}` : ''}</b> and reach you on <b>{contact}</b>. You&apos;ll
              get before/after proof once it&apos;s done.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link href="/sabi/orders" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-sm">View my orders</Link>
              <Link href="/sabi/services" className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm">Book another</Link>
            </div>
          </div>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-lime-500/15 text-lime-300 border border-lime-500/25 mb-3">
              <FiMapPin /> Real-World Gig
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Book: {service.name}</h1>
            <p className="text-slate-400 text-sm mb-6">
              {service.description.replace(/\*\*|🕵️|📋|🎨|✅|🧍|📢|🎪|🛵|📸|🧃|→|#/g, '').split('\n')[0].trim()}
            </p>

            <div className="premium-glass rounded-2xl p-5 sm:p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-300 mb-1.5">State / area <span className="text-red-400">*</span></span>
                  <select value={state} onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm outline-none focus:border-blue-500/50">
                    <option value="">Choose a state…</option>
                    {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-300 mb-1.5">City / specific place</span>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lekki, or a branch address"
                    className="w-full px-3.5 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50" />
                </label>
              </div>

              <label className="block">
                <span className="block text-sm font-semibold text-slate-300 mb-1.5">What should they do? <span className="text-red-400">*</span></span>
                <textarea value={taskBrief} onChange={(e) => setTaskBrief(e.target.value)} rows={4}
                  placeholder="e.g. Visit the Lekki branch as a normal customer, buy one item, note how long you waited and whether staff greeted you. Take a photo of the receipt."
                  className="w-full px-3.5 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50 resize-y" />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-300 mb-1.5">How many people / visits <span className="text-red-400">*</span></span>
                  <input type="number" min={service.minQuantity} max={service.maxQuantity} value={headcount || ''}
                    onChange={(e) => setHeadcount(Math.floor(Number(e.target.value)) || 0)}
                    className="w-full px-3.5 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm outline-none focus:border-blue-500/50" />
                  <span className="block text-[11px] text-slate-500 mt-1">Min {service.minQuantity} · Max {service.maxQuantity.toLocaleString()}</span>
                </label>
                <label className="block">
                  <span className="block text-sm font-semibold text-slate-300 mb-1.5">Preferred date</span>
                  <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm outline-none focus:border-blue-500/50" />
                </label>
              </div>

              <label className="block">
                <span className="block text-sm font-semibold text-slate-300 mb-1.5">Your contact (WhatsApp / phone) <span className="text-red-400">*</span></span>
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. 0803 000 0000"
                  className="w-full px-3.5 py-3 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/50" />
                <span className="block text-[11px] text-slate-500 mt-1">Our field team uses this to coordinate — never shown publicly.</span>
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <div>
                  <span className="block text-[11px] text-slate-500">Total (from your SABI wallet)</span>
                  <span className="text-emerald-400 font-black text-lg">₦{(priceKobo / 100).toLocaleString()}</span>
                </div>
                <button type="button" disabled={!ready || busy} onClick={book}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-lime-500 to-green-600 hover:brightness-110 text-white font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5">
                  {busy ? 'Booking…' : <>Book &amp; pay <FiArrowRight /></>}
                </button>
              </div>

              {err && <p className="text-red-400 text-sm">{err}</p>}
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Physical gigs are coordinated by our field team (not instant). You&apos;ll get before/after
                proof, and if we can&apos;t fulfil it you&apos;re refunded in full.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
