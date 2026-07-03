import type { IconType } from 'react-icons';

/**
 * Premium page hero shared by the Studio feature pages (Auto Engagement, Book Creators,
 * My Profiles, Team). A gradient icon chip + accent glow + editorial heading gives each
 * page a "destination" feel instead of a plain list header. `accent` is a Tailwind
 * gradient pair, e.g. "from-pink-500 to-purple-600".
 */
export function PageHero({
  icon: Icon, eyebrow, title, subtitle, accent, badge, children,
}: {
  icon: IconType;
  eyebrow: string;
  title: string;
  subtitle?: string;
  accent: string;      // "from-pink-500 to-purple-600"
  badge?: string;
  children?: React.ReactNode; // optional actions on the right
}) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-7">
      {/* accent glow */}
      <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-3xl`} />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {eyebrow}
            {badge && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-white">{badge}</span>}
          </div>
          <h1 className="text-[clamp(26px,6vw,38px)] font-black leading-[1.05] tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">{subtitle}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
