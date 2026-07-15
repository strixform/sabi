import Image from "next/image";

/**
 * Tiny cross-promo for ChequeMate (our group-savings app). Links out to chequemateapp.com.
 * `compact` = inline pill for logged-in dashboards; default = a small card for public pages.
 */
export default function ChequeMateAd({ compact = false }: { compact?: boolean }) {
  const href = "https://chequemateapp.com/?utm_source=sabi";
  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-xl px-3 py-2 transition"
        style={{ background: "rgba(21,158,75,0.10)", border: "1px solid rgba(21,158,75,0.30)" }}
      >
        <Image src="/chequemate-icon.png" alt="ChequeMate" width={22} height={22} className="rounded-md" style={{ height: 22, width: 22 }} />
        <span className="text-[13px] font-semibold" style={{ color: "#3ddc84" }}>Join Ajo Cycles on ChequeMate</span>
        <span className="ml-auto text-[13px]" style={{ color: "#3ddc84" }}>→</span>
      </a>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:-translate-y-0.5"
      style={{ background: "rgba(21,158,75,0.10)", border: "1px solid rgba(21,158,75,0.30)" }}
    >
      <Image src="/chequemate-icon.png" alt="ChequeMate" width={32} height={32} className="rounded-lg" style={{ height: 32, width: 32 }} />
      <span className="text-left">
        <span className="block text-sm font-bold text-white">Save with your people</span>
        <span className="block text-[12px]" style={{ color: "#9fe3bd" }}>Join or start Ajo Cycles on ChequeMate</span>
      </span>
      <span className="ml-1 text-lg" style={{ color: "#3ddc84" }}>→</span>
    </a>
  );
}
