'use client';

import { motion } from 'framer-motion';

/**
 * "Nigerian reach" panel — honest marketing visual of where SABI's real crowd
 * operates. Not per-order geolocation (we don't claim exact tasker locations);
 * it communicates that delivery comes from real people across Nigeria.
 */
const ZONES: { zone: string; states: string[] }[] = [
  { zone: 'South West', states: ['Lagos', 'Oyo', 'Ogun', 'Osun', 'Ondo', 'Ekiti'] },
  { zone: 'South East', states: ['Enugu', 'Anambra', 'Imo', 'Abia', 'Ebonyi'] },
  { zone: 'South South', states: ['Rivers', 'Delta', 'Edo', 'Akwa Ibom', 'Cross River', 'Bayelsa'] },
  { zone: 'North Central', states: ['Abuja', 'Kwara', 'Benue', 'Niger', 'Plateau', 'Kogi'] },
  { zone: 'North West', states: ['Kano', 'Kaduna', 'Sokoto', 'Katsina', 'Kebbi', 'Zamfara'] },
  { zone: 'North East', states: ['Borno', 'Bauchi', 'Gombe', 'Yobe', 'Adamawa', 'Taraba'] },
];

export function NigerianReach({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🇳🇬</span>
        <h3 className="font-bold text-white">Delivered by real Nigerians — nationwide</h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">Our crowd of 300,000+ active Nigerians spans every geopolitical zone. Real people, real accounts, real engagement.</p>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {ZONES.map((z, i) => (
          <motion.div
            key={z.zone}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <motion.span
                className="w-2 h-2 rounded-full bg-emerald-400 inline-block"
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
              />
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">{z.zone}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {z.states.slice(0, compact ? 3 : 6).map((s) => (
                <span key={s} className="text-[10px] text-slate-400">{s}</span>
              )).reduce((acc: any[], el, idx, arr) => {
                acc.push(el);
                if (idx < arr.length - 1) acc.push(<span key={`d${idx}`} className="text-[10px] text-slate-600">·</span>);
                return acc;
              }, [])}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
